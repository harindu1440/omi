import { SupabaseClient } from '@supabase/supabase-js';
import { PublicGameState, PrivatePlayerState, Position, Card } from '@/types/game';

/**
 * Strips private server-only data from the database game row and converts it
 * to a clean PublicGameState object safe for all clients.
 */
export function buildPublicGameState(
  gameRow: any, 
  players: any[], 
  currentTrick: any | null,
  completedTricks: any[],
  roundResult: any | null
): PublicGameState {
  return {
    gameId: gameRow.id,
    phase: gameRow.phase,
    players: players.map((p: any) => ({
      userId: p.user_id,
      username: p.profiles?.username ?? 'Unknown',
      position: p.position,
      team: p.team,
      // cardCount is derived from the hands object to ensure it is always accurate
      cardCount: gameRow.hands && gameRow.hands[p.position] ? gameRow.hands[p.position].length : 0,
      isConnected: p.is_connected,
      isActive: p.position !== gameRow.inactive_player_position,
    })),
    trumpSuit: gameRow.trump_suit,
    trumpCallerPosition: gameRow.trump_caller_position,
    dealerPosition: gameRow.dealer_position,
    
    // currentTrick and completedTricks are explicitly passed in after querying the tricks table
    currentTrick: currentTrick,
    completedTricks: completedTricks,
    
    katakola: {
      team0: gameRow.katakola_team0,
      team1: gameRow.katakola_team1,
      bonusPool: gameRow.katakola_bonus_pool,
    },
    
    roundResult: roundResult,
    courtType: gameRow.court_type,
    courtRequesterPosition: gameRow.court_requester_position,
    courtTrumpSuit: gameRow.court_trump_suit,
    inactivePlayerPosition: gameRow.inactive_player_position,
    
    kapothi: {
      announced: gameRow.kapothi_announced,
      eligible: gameRow.kapothi_eligible,
    },
    
    cardExchangePhase: gameRow.card_exchange_phase,
    roundNumber: gameRow.round_number,
    matchWinner: gameRow.match_winner ?? null,
  };
}

/**
 * Broadcasts the public game state to all players in the room,
 * and sends each player their specific private hand via private channels.
 */
export async function broadcastGameState(
  supabase: SupabaseClient,
  gameRow: any,
  players: any[],
  currentTrick: any | null = null,
  completedTricks: any[] = [],
  roundResult: any | null = null
) {
  const publicState = buildPublicGameState(gameRow, players, currentTrick, completedTricks, roundResult);

  // Broadcast to public channel
  await supabase
    .channel(`game:${gameRow.id}:public`)
    .send({
      type: 'broadcast',
      event: 'game_state',
      payload: { state: publicState },
    });

  // Broadcast private hands
  for (const player of players) {
    const position = player.position as Position;
    const hand = (gameRow.hands as any)[position] ?? [];
    
    // Calculate legal plays based on the current trick led suit
    let legalPlays = hand.map((c: Card) => c.id);
    if (currentTrick && currentTrick.ledSuit && currentTrick.currentTurn === position) {
      const hasSuit = hand.some((c: Card) => c.suit === currentTrick.ledSuit);
      if (hasSuit) {
        legalPlays = hand.filter((c: Card) => c.suit === currentTrick.ledSuit).map((c: Card) => c.id);
      }
    }

    await supabase
      .channel(`game:${gameRow.id}:player:${player.user_id}`)
      .send({
        type: 'broadcast',
        event: 'player_hand',
        payload: {
          hand,
          legalPlays,
        },
      });
  }
}
