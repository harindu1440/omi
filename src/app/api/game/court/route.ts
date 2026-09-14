import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { broadcastGameState } from '@/lib/game-engine/state-machine';
import { Position, Suit, Card } from '@/types/game';

export async function POST(request: NextRequest) {
  try {
    const { gameId, userId, action, payload } = await request.json();

    if (!gameId || !userId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: game } = await supabase.from('games').select('*').eq('id', gameId).single();
    if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });

    const { data: players } = await supabase.from('room_players').select('*, profiles(username)').eq('room_id', game.room_id);
    const player = players?.find(p => p.user_id === userId);
    if (!player) return NextResponse.json({ error: 'Player not in room' }, { status: 403 });

    const position = player.position as Position;
    const team = player.team;

    // Default return payload
    let success = true;

    if (action === 'request_half') {
      if (game.phase !== 'court_window') return NextResponse.json({ error: 'Not in court window' }, { status: 400 });
      // Only opposing team can request court
      const callerTeam = game.trump_caller_position % 2;
      if (team === callerTeam) return NextResponse.json({ error: 'Cannot call court on your own deal' }, { status: 403 });

      await supabase.from('games').update({
        phase: 'half_court_pending',
        court_requester_position: position,
      }).eq('id', gameId);

    } else if (action === 'declare_half_trump') {
      if (game.phase !== 'half_court_pending') return NextResponse.json({ error: 'No half court pending' }, { status: 400 });
      if (position !== game.court_requester_position) return NextResponse.json({ error: 'Not the requester' }, { status: 403 });

      const newTrumpSuit = payload.suit as Suit;
      if (!newTrumpSuit) return NextResponse.json({ error: 'Missing suit' }, { status: 400 });

      const inactivePos = ((position + 2) % 4) as Position;

      await supabase.from('games').update({
        phase: 'half_court_playing',
        court_type: 'half',
        court_trump_suit: newTrumpSuit,
        inactive_player_position: inactivePos,
        trump_suit: newTrumpSuit, // Override original trump
      }).eq('id', gameId);

    } else if (action === 'request_full') {
      if (game.phase !== 'court_window') return NextResponse.json({ error: 'Not in court window' }, { status: 400 });
      const callerTeam = game.trump_caller_position % 2;
      if (team === callerTeam) return NextResponse.json({ error: 'Cannot call court on your own deal' }, { status: 403 });

      // Requires 2 specific cards requested
      const requestedCardIds = payload.requestedCardIds as string[];
      if (!requestedCardIds || requestedCardIds.length !== 2) return NextResponse.json({ error: 'Must request exactly 2 cards' }, { status: 400 });

      await supabase.from('games').update({
        phase: 'full_court_pending',
        court_requester_position: position,
        card_exchange_phase: 'partner_choosing',
        requested_card_ids: requestedCardIds,
      }).eq('id', gameId);

    } else if (action === 'partner_give_cards') {
      if (game.phase !== 'full_court_pending' || game.card_exchange_phase !== 'partner_choosing') {
        return NextResponse.json({ error: 'Not in partner choosing phase' }, { status: 400 });
      }
      
      const partnerPos = ((game.court_requester_position + 2) % 4) as Position;
      if (position !== partnerPos) return NextResponse.json({ error: 'Not the partner' }, { status: 403 });

      const givenCardIds = payload.givenCardIds as string[]; // Can be empty if they don't have them
      
      // Move cards from partner to requester
      const partnerHand = game.hands[partnerPos] as Card[];
      const requesterHand = game.hands[game.court_requester_position] as Card[];
      
      const givenCards = partnerHand.filter(c => givenCardIds.includes(c.id));
      
      // Remove from partner
      game.hands[partnerPos] = partnerHand.filter(c => !givenCardIds.includes(c.id));
      // Add to requester
      game.hands[game.court_requester_position] = [...requesterHand, ...givenCards];

      await supabase.from('games').update({
        card_exchange_phase: 'requester_deciding',
        given_cards: givenCards,
        hands: game.hands,
      }).eq('id', gameId);

    } else if (action === 'requester_return_cards') {
      if (game.phase !== 'full_court_pending' || game.card_exchange_phase !== 'requester_deciding') {
        return NextResponse.json({ error: 'Not in deciding phase' }, { status: 400 });
      }
      if (position !== game.court_requester_position) return NextResponse.json({ error: 'Not the requester' }, { status: 403 });

      const returnedCardIds = payload.returnedCardIds as string[];
      const newTrumpSuit = payload.suit as Suit;

      if (!returnedCardIds || returnedCardIds.length !== (game.given_cards?.length || 0)) {
        return NextResponse.json({ error: 'Must return exactly the number of cards received' }, { status: 400 });
      }

      const partnerPos = ((position + 2) % 4) as Position;
      const requesterHand = game.hands[position] as Card[];
      const partnerHand = game.hands[partnerPos] as Card[];

      const returnedCards = requesterHand.filter(c => returnedCardIds.includes(c.id));

      game.hands[position] = requesterHand.filter(c => !returnedCardIds.includes(c.id));
      game.hands[partnerPos] = [...partnerHand, ...returnedCards];

      await supabase.from('games').update({
        phase: 'full_court_playing',
        card_exchange_phase: 'done',
        court_type: 'full',
        court_trump_suit: newTrumpSuit,
        inactive_player_position: partnerPos,
        trump_suit: newTrumpSuit,
        hands: game.hands,
      }).eq('id', gameId);

    } else if (action === 'cancel_court') {
      // Revert to normal play
      await supabase.from('games').update({
        phase: 'playing',
        court_requester_position: null,
        court_type: 'none',
        card_exchange_phase: null,
      }).eq('id', gameId);

    } else if (action === 'skip_court_window') {
      if (game.phase !== 'court_window') return NextResponse.json({ error: 'Not in court window' }, { status: 400 });
      
      await supabase.from('games').update({
        phase: 'playing'
      }).eq('id', gameId);
    } else {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    // Refresh game and broadcast
    const { data: updatedGame } = await supabase.from('games').select('*').eq('id', gameId).single();
    
    // We assume trick 1 is still empty since court window happens before play starts
    const currentTrickState = {
      trickNumber: 1,
      plays: [],
      ledSuit: null,
      currentTurn: ((updatedGame.dealer_position + 1) % 4) as Position,
      tricksTeam0: 0,
      tricksTeam1: 0,
    };

    await broadcastGameState(supabase, updatedGame, players || [], currentTrickState, []);

    return NextResponse.json({ success });
  } catch (err) {
    console.error('[court-action]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
