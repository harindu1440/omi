import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { broadcastGameState } from '@/lib/game-engine/state-machine';
import { isLegalPlay, determineTrickWinner } from '@/lib/game-engine/trick';
import { calculateNormalRoundResult, calculateHalfCourtResult, calculateFullCourtResult } from '@/lib/game-engine/scoring';
import { Position, CardPlay, Trick, GamePhase, CourtType } from '@/types/game';

export async function POST(request: NextRequest) {
  try {
    const { gameId, userId, cardId } = await request.json();

    if (!gameId || !userId || !cardId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Load game
    const { data: game } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });

    const validPhases: GamePhase[] = ['playing', 'half_court_playing', 'full_court_playing'];
    if (!validPhases.includes(game.phase)) {
      return NextResponse.json({ error: 'Not in a playing phase' }, { status: 400 });
    }

    const { data: players } = await supabase
      .from('room_players')
      .select('*, profiles(username)')
      .eq('room_id', game.room_id);

    const player = players?.find(p => p.user_id === userId);
    if (!player) return NextResponse.json({ error: 'Player not in room' }, { status: 403 });

    const position = player.position as Position;

    // 2. Load active trick
    const { data: currentTrickRow } = await supabase
      .from('tricks')
      .select('*')
      .eq('game_id', gameId)
      .eq('trick_number', game.current_trick_number)
      .single();

    if (!currentTrickRow) return NextResponse.json({ error: 'Current trick not found' }, { status: 500 });

    const plays: CardPlay[] = currentTrickRow.cards_played || [];
    
    // Determine whose turn it is. 
    // In standard Omi, if trick is empty, it's the winner of the last trick.
    // If it's the first trick, it was set when starting the play phase.
    // Wait, we need to know the current turn based on previous plays.
    // If plays is empty, the current turn is whoever led. Who led? 
    // It should be stored somewhere, or we can just derive it.
    // Since we don't store "current_turn" in the tricks table initially, we assume:
    // If empty: it's the turn of whoever won the last trick. For trick 1, it's (dealer+1)%4.
    let expectedTurn = position; // Fallback
    
    // We must rebuild currentTrickState to know currentTurn
    let ledSuit = currentTrickRow.led_suit;
    if (plays.length === 0) {
      if (game.current_trick_number === 1) {
        expectedTurn = ((game.dealer_position + 1) % 4) as Position;
      } else {
        // Find winner of previous trick
        const { data: prevTrick } = await supabase
          .from('tricks')
          .select('winner_position')
          .eq('game_id', gameId)
          .eq('trick_number', game.current_trick_number - 1)
          .single();
        expectedTurn = prevTrick?.winner_position ?? 0;
      }
    } else {
      // It's the turn of the player next to the last player
      // We must skip the inactive player if in a court mode
      const lastPlayPosition = plays[plays.length - 1].position;
      let nextPos = ((lastPlayPosition + 1) % 4) as Position;
      if (game.inactive_player_position !== null && nextPos === game.inactive_player_position) {
        nextPos = ((nextPos + 1) % 4) as Position;
      }
      expectedTurn = nextPos;
    }

    if (position !== expectedTurn) {
      return NextResponse.json({ error: 'Not your turn' }, { status: 403 });
    }

    // 3. Validate hand and legal play
    const hand = game.hands[position] || [];
    const cardIndex = hand.findIndex((c: any) => c.id === cardId);
    
    if (cardIndex === -1) {
      return NextResponse.json({ error: 'Card not in hand' }, { status: 403 });
    }

    const card = hand[cardIndex];

    if (plays.length > 0 && !isLegalPlay(card, hand, ledSuit, game.trump_suit)) {
      return NextResponse.json({ error: 'Illegal play' }, { status: 400 });
    }

    // 4. Update Trick state
    if (plays.length === 0) {
      ledSuit = card.suit;
    }

    const newPlay: CardPlay = {
      position,
      card,
      playedAt: new Date().toISOString(),
    };

    plays.push(newPlay);

    // Remove card from hand
    hand.splice(cardIndex, 1);
    game.hands[position] = hand;

    const maxPlays = game.inactive_player_position !== null ? 3 : 4;
    const isTrickComplete = plays.length === maxPlays;

    let trickWinnerPos = null;
    let trickWinnerTeam = null;

    if (isTrickComplete) {
      const winner = determineTrickWinner(plays, ledSuit, game.trump_suit);
      trickWinnerPos = winner.winnerPosition;
      trickWinnerTeam = winner.winnerTeam;
      
      if (trickWinnerTeam === 0) game.tricks_team0++;
      if (trickWinnerTeam === 1) game.tricks_team1++;
    }

    // Update Trick row
    await supabase
      .from('tricks')
      .update({
        cards_played: plays,
        led_suit: ledSuit,
        winner_position: trickWinnerPos,
        winner_team: trickWinnerTeam,
        completed_at: isTrickComplete ? new Date().toISOString() : null,
      })
      .eq('id', currentTrickRow.id);

    // 5. Update Game state
    let nextPhase = game.phase;
    let roundResult = null;
    
    const maxTricks = game.court_type === 'half' ? 4 : 8;
    const isRoundComplete = isTrickComplete && game.current_trick_number === maxTricks;

    if (isRoundComplete) {
      nextPhase = 'round_end';
      
      const katakolaState = {
        team0: game.katakola_team0,
        team1: game.katakola_team1,
        bonusPool: game.katakola_bonus_pool,
      };

      let result;
      
      const trumpCallerTeam = (game.trump_caller_position % 2) as 0 | 1;
      const requesterTeam = game.court_requester_position !== null ? (game.court_requester_position % 2) as 0 | 1 : null;

      if (game.court_type === 'half') {
        const tricksRequesterTeam = requesterTeam === 0 ? game.tricks_team0 : game.tricks_team1;
        const tricksOpponentTeam = requesterTeam === 0 ? game.tricks_team1 : game.tricks_team0;
        result = calculateHalfCourtResult({
          tricksRequesterTeam,
          tricksOpponentTeam,
          requesterTeam: requesterTeam!,
          katakola: katakolaState
        });
      } else if (game.court_type === 'full') {
        const tricksRequesterTeam = requesterTeam === 0 ? game.tricks_team0 : game.tricks_team1;
        const tricksOpponentTeam = requesterTeam === 0 ? game.tricks_team1 : game.tricks_team0;
        result = calculateFullCourtResult({
          tricksRequesterTeam,
          tricksOpponentTeam,
          requesterTeam: requesterTeam!,
          katakola: katakolaState
        });
      } else {
        result = calculateNormalRoundResult({
          tricksTeam0: game.tricks_team0,
          tricksTeam1: game.tricks_team1,
          trumpCallerTeam,
          kapothiAnnounced: game.kapothi_announced,
          katakola: katakolaState
        });
      }
      
      roundResult = result;

      await supabase
        .from('games')
        .update({
          phase: nextPhase,
          hands: game.hands,
          tricks_team0: game.tricks_team0,
          tricks_team1: game.tricks_team1,
          katakola_team0: result.katakolaAfter.team0,
          katakola_team1: result.katakolaAfter.team1,
          katakola_bonus_pool: result.katakolaAfter.bonusPool,
          round_result: result,
        })
        .eq('id', gameId);

    } else if (isTrickComplete) {
      // Start next trick
      game.current_trick_number++;
      await supabase
        .from('tricks')
        .insert({
          game_id: gameId,
          trick_number: game.current_trick_number,
          led_suit: null,
          cards_played: [],
        });

      await supabase
        .from('games')
        .update({
          hands: game.hands,
          tricks_team0: game.tricks_team0,
          tricks_team1: game.tricks_team1,
          current_trick_number: game.current_trick_number,
        })
        .eq('id', gameId);
    } else {
      // Just update hands
      await supabase
        .from('games')
        .update({ hands: game.hands })
        .eq('id', gameId);
    }

    // 6. Broadcast
    // Construct currentTrick for broadcast
    let nextTurn = expectedTurn;
    if (isTrickComplete && !isRoundComplete) {
      nextTurn = trickWinnerPos!; // Winner starts next trick
    } else if (!isTrickComplete) {
      let np = ((position + 1) % 4) as Position;
      if (np === game.inactive_player_position) np = ((np + 1) % 4) as Position;
      nextTurn = np;
    }

    const currentTrickState = {
      trickNumber: game.current_trick_number,
      plays,
      ledSuit,
      currentTurn: nextTurn,
      tricksTeam0: game.tricks_team0,
      tricksTeam1: game.tricks_team1,
    };

    // Load completed tricks
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

    // Re-fetch updated game for broadcast
    const { data: updatedGame } = await supabase.from('games').select('*').eq('id', gameId).single();

    await broadcastGameState(supabase, updatedGame, players || [], currentTrickState, completedTricks, roundResult);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[play-card]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
