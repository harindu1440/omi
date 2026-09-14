import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { buildPublicGameState } from '@/lib/game-engine/state-machine';
import { Position, Card } from '@/types/game';

export async function POST(request: NextRequest) {
  try {
    const { gameId, userId } = await request.json();

    if (!gameId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: game } = await supabase.from('games').select('*').eq('id', gameId).single();
    if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });

    const { data: players } = await supabase.from('room_players').select('*, profiles(username)').eq('room_id', game.room_id);
    
    const player = players?.find(p => p.user_id === userId);
    if (!player) return NextResponse.json({ error: 'User is not in this game' }, { status: 403 });

    // Build completed tricks for the public state
    const { data: allTricks } = await supabase
      .from('tricks')
      .select('*')
      .eq('game_id', gameId)
      .order('trick_number', { ascending: true });

    const completedTricks = allTricks
      ?.filter(t => t.winner_position !== null)
      .map(t => ({
        trickNumber: t.trick_number,
        ledSuit: t.led_suit,
        plays: t.cards_played,
        winnerPosition: t.winner_position,
        winnerTeam: t.winner_team,
      })) || [];

    let currentTrickRow = allTricks?.find(t => t.trick_number === game.current_trick_number);
    let currentTrickState = null;

    if (currentTrickRow) {
      // Figure out current turn
      const plays = currentTrickRow.cards_played || [];
      let expectedTurn = player.position as Position;
      
      if (plays.length === 0) {
        if (game.current_trick_number === 1) {
          expectedTurn = ((game.dealer_position + 1) % 4) as Position;
        } else {
          const prevTrick = allTricks?.find(t => t.trick_number === game.current_trick_number - 1);
          expectedTurn = prevTrick?.winner_position ?? 0;
        }
      } else {
        const lastPlayPosition = plays[plays.length - 1].position;
        let nextPos = ((lastPlayPosition + 1) % 4) as Position;
        if (game.inactive_player_position !== null && nextPos === game.inactive_player_position) {
          nextPos = ((nextPos + 1) % 4) as Position;
        }
        expectedTurn = nextPos;
      }

      currentTrickState = {
        trickNumber: game.current_trick_number,
        plays,
        ledSuit: currentTrickRow.led_suit,
        currentTurn: expectedTurn,
        tricksTeam0: game.tricks_team0,
        tricksTeam1: game.tricks_team1,
      };
    }

    const publicState = buildPublicGameState(
      game, 
      players || [], 
      currentTrickState, 
      completedTricks, 
      game.round_result ?? null
    );

    // Private state
    const position = player.position as Position;
    const hand = (game.hands as any)[position] ?? [];
    
    let legalPlays = hand.map((c: Card) => c.id);
    if (currentTrickState && currentTrickState.ledSuit && currentTrickState.currentTurn === position) {
      const hasSuit = hand.some((c: Card) => c.suit === currentTrickState.ledSuit);
      if (hasSuit) {
        legalPlays = hand.filter((c: Card) => c.suit === currentTrickState.ledSuit).map((c: Card) => c.id);
      }
    }

    return NextResponse.json({
      publicState,
      privateState: {
        hand,
        legalPlays,
      }
    });
  } catch (err) {
    console.error('[game/sync]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
