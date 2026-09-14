import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { freshShuffledDeck } from '@/lib/game-engine/deck';
import { dealFirstFour, getTrumpCallerPosition } from '@/lib/game-engine/dealing';
import { broadcastGameState } from '@/lib/game-engine/state-machine';
import { Position } from '@/types/game';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, userId } = body as { roomId: string; userId: string };

    if (!roomId || !userId) {
      return NextResponse.json({ error: 'Missing roomId or userId' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Validate host
    const { data: hostPlayer } = await supabase
      .from('room_players')
      .select('*')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .eq('is_host', true)
      .single();

    if (!hostPlayer) {
      return NextResponse.json({ error: 'Only the host can start the game' }, { status: 403 });
    }

    // Check all 4 players are present and ready
    const { data: players } = await supabase
      .from('room_players')
      .select('*, profiles(username, avatar_url)')
      .eq('room_id', roomId);

    if (!players || players.length < 4) {
      return NextResponse.json({ error: 'Need 4 players to start' }, { status: 400 });
    }

    const allReady = players.every((p: any) => p.is_ready);
    if (!allReady) {
      return NextResponse.json({ error: 'All players must be ready' }, { status: 400 });
    }

    // Update room status
    await supabase
      .from('rooms')
      .update({ status: 'playing' })
      .eq('id', roomId);

    // Generate fresh shuffled deck
    const deck = freshShuffledDeck();

    // Dealer is position 0 for first round
    const dealerPosition = 0 as Position;
    const trumpCallerPosition = getTrumpCallerPosition(dealerPosition);

    // Deal first 4 cards to each player
    const { hands, remainingDeck } = dealFirstFour(deck, dealerPosition);

    // Create game record (hands and deck_state are server-only)
    const { data: game, error: gameError } = await supabase
      .from('games')
      .insert({
        room_id: roomId,
        phase: 'dealing_first',
        round_number: 1,
        dealer_position: dealerPosition,
        trump_caller_position: trumpCallerPosition,
        katakola_team0: 10,
        katakola_team1: 10,
        katakola_bonus_pool: 0,
        current_trick_number: 0,
        tricks_team0: 0,
        tricks_team1: 0,
        deck_state: remainingDeck,  // Remaining deck after first deal
        hands: hands,               // SERVER-ONLY: never sent to clients
      })
      .select()
      .single();

    if (gameError || !game) {
      console.error('Game creation error:', gameError);
      return NextResponse.json({ error: 'Failed to create game' }, { status: 500 });
    }

    // Transition to trump_selection phase
    const { data: updatedGame } = await supabase
      .from('games')
      .update({ phase: 'trump_selection' })
      .eq('id', game.id)
      .select()
      .single();

    // Broadcast updated state securely
    await broadcastGameState(supabase, updatedGame, players);

    return NextResponse.json({
      gameId: game.id,
      success: true,
    });
  } catch (err) {
    console.error('[game/start]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
