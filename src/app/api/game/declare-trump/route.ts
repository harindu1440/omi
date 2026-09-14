import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { broadcastGameState } from '@/lib/game-engine/state-machine';
import { dealRemainingFour } from '@/lib/game-engine/dealing';
import { Position, Suit } from '@/types/game';

export async function POST(request: NextRequest) {
  try {
    const { gameId, userId, suit } = await request.json() as { gameId: string; userId: string; suit: Suit };

    if (!gameId || !userId || !suit) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Fetch game and players
    const { data: game } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    if (game.phase !== 'trump_selection') {
      return NextResponse.json({ error: 'Not in trump selection phase' }, { status: 400 });
    }

    const { data: players } = await supabase
      .from('room_players')
      .select('*, profiles(username)')
      .eq('room_id', game.room_id);

    if (!players || players.length !== 4) {
      return NextResponse.json({ error: 'Players not found' }, { status: 500 });
    }

    // 2. Validate caller
    const callingPlayer = players.find(p => p.user_id === userId);
    if (!callingPlayer) {
      return NextResponse.json({ error: 'User is not in this game' }, { status: 403 });
    }

    if (callingPlayer.position !== game.trump_caller_position) {
      return NextResponse.json({ error: 'You are not the trump caller' }, { status: 403 });
    }

    // 3. Deal the remaining 4 cards
    const { hands, remainingDeck } = dealRemainingFour(game.deck_state, game.hands, game.dealer_position);

    // 4. Create the first trick
    // The player to the right of the dealer leads the first trick (which is the trump caller, unless broken).
    // In standard Omi, the player to the right of the dealer leads.
    // getPartnerPosition / nextPosition helpers exist. Counter-clockwise: 0->1->2->3.
    // Dealer is X. Next is (X + 1) % 4.
    const firstTurnPosition = ((game.dealer_position + 1) % 4) as Position;

    const { data: trick, error: trickError } = await supabase
      .from('tricks')
      .insert({
        game_id: gameId,
        trick_number: 1,
        led_suit: null,
        cards_played: [],
        winner_position: null,
        winner_team: null
      })
      .select()
      .single();

    if (trickError || !trick) {
      console.error('Failed to create trick', trickError);
      return NextResponse.json({ error: 'Failed to create trick' }, { status: 500 });
    }

    // 5. Update game state to 'playing'
    const { data: updatedGame, error: updateError } = await supabase
      .from('games')
      .update({
        trump_suit: suit,
        phase: 'court_window', // brief window before 'playing' to allow Half Court requests
        hands: hands,
        deck_state: remainingDeck,
        current_trick_number: 1,
      })
      .eq('id', gameId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update game state', updateError);
      return NextResponse.json({ error: 'Failed to update game state' }, { status: 500 });
    }

    // Construct the currentTrick object for broadcast
    const currentTrickState = {
      trickNumber: 1,
      plays: [],
      ledSuit: null,
      currentTurn: firstTurnPosition,
      tricksTeam0: 0,
      tricksTeam1: 0,
    };

    // 6. Broadcast updated state
    await broadcastGameState(supabase, updatedGame, players, currentTrickState, []);

    // 7. Auto-transition to 'playing' after a short delay if no one calls Half Court
    // In a pure serverless architecture, we could use an edge function or just rely on the 
    // frontend to render "playing" naturally if the court_window expires.
    // For this architecture, we will broadcast 'court_window' first.

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[declare-trump]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
