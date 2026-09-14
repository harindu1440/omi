/**
 * court.ts — Server-only Half Court and Full Court eligibility and logic.
 *
 * NEVER import this on the client side.
 *
 * Local rules:
 * - Half Court: available after first 4 cards dealt. Only non-caller team can request.
 *   Inactive player = requester's teammate.
 *   Requester declares new trump. 4 tricks played by 3 players.
 *   Win = 3 Katakola.
 *
 * - Full Court: available after all 8 cards dealt (court_window phase).
 *   Only non-caller team can request.
 *   Requester asks for 2 specific cards from teammate.
 *   Teammate gives those cards, receives 2 back.
 *   Requester can then accept or cancel.
 *   If accepted: inactive player = requester's teammate.
 *   Requester declares new trump. 8 tricks by 3 players.
 *   Win = 3 Katakola.
 */

import {
  Position,
  Team,
  Card,
  GamePhase,
  CourtType,
  positionToTeam,
  getPartnerPosition,
} from '@/types/game';
import { Hands } from './dealing';
import { removeCardFromHand } from './deck';

// ─── Eligibility ──────────────────────────────────────────────────────────────

/**
 * Check if Half Court can be requested.
 * Only the non-caller team can request, after first 4 cards are dealt.
 */
export function isHalfCourtEligible(params: {
  requesterPosition: Position;
  trumpCallerPosition: Position;
  phase: GamePhase;
}): { eligible: boolean; reason?: string } {
  const { requesterPosition, trumpCallerPosition, phase } = params;

  if (phase !== 'trump_selection' && phase !== 'dealing_rest' && phase !== 'court_window') {
    return { eligible: false, reason: 'Half Court can only be requested after first 4 cards are dealt' };
  }

  const requesterTeam = positionToTeam(requesterPosition);
  const callerTeam = positionToTeam(trumpCallerPosition);

  if (requesterTeam === callerTeam) {
    return { eligible: false, reason: 'Only the non-calling team can request Half Court' };
  }

  return { eligible: true };
}

/**
 * Check if Full Court can be requested.
 * Only the non-caller team can request, after all 8 cards are dealt.
 */
export function isFullCourtEligible(params: {
  requesterPosition: Position;
  trumpCallerPosition: Position;
  phase: GamePhase;
}): { eligible: boolean; reason?: string } {
  const { requesterPosition, trumpCallerPosition, phase } = params;

  if (phase !== 'court_window' && phase !== 'playing') {
    return { eligible: false, reason: 'Full Court can only be requested after all 8 cards are dealt' };
  }

  const requesterTeam = positionToTeam(requesterPosition);
  const callerTeam = positionToTeam(trumpCallerPosition);

  if (requesterTeam === callerTeam) {
    return { eligible: false, reason: 'Only the non-calling team can request Full Court' };
  }

  return { eligible: true };
}

// ─── Card Exchange (Full Court) ───────────────────────────────────────────────

/**
 * Validate that the requester is asking for cards that their partner actually holds.
 */
export function validateCardRequest(params: {
  requestedCardIds: string[];
  partnerPosition: Position;
  hands: Hands;
}): { valid: boolean; reason?: string } {
  const { requestedCardIds, partnerPosition, hands } = params;

  if (requestedCardIds.length !== 2) {
    return { valid: false, reason: 'Must request exactly 2 cards' };
  }

  const partnerHand = hands[partnerPosition];
  for (const cardId of requestedCardIds) {
    if (!partnerHand.find((c) => c.id === cardId)) {
      return { valid: false, reason: `Card ${cardId} is not in partner's hand` };
    }
  }

  return { valid: true };
}

/**
 * Validate that the return cards are in the requester's hand (after receiving).
 */
export function validateReturnCards(params: {
  returnCardIds: string[];
  requesterPosition: Position;
  hands: Hands;
}): { valid: boolean; reason?: string } {
  const { returnCardIds, requesterPosition, hands } = params;

  if (returnCardIds.length !== 2) {
    return { valid: false, reason: 'Must return exactly 2 cards' };
  }

  const requesterHand = hands[requesterPosition];
  for (const cardId of returnCardIds) {
    if (!requesterHand.find((c) => c.id === cardId)) {
      return { valid: false, reason: `Card ${cardId} is not in requester's hand` };
    }
  }

  return { valid: true };
}

/**
 * Execute the card exchange between requester and partner.
 * Returns updated hands after the exchange.
 */
export function executeCardExchange(params: {
  requesterPosition: Position;
  partnerPosition: Position;
  requestedCardIds: string[];
  returnCardIds: string[];
  hands: Hands;
}): { hands: Hands; exchangedCards: { requested: Card[]; returned: Card[] } } {
  const { requesterPosition, partnerPosition, requestedCardIds, returnCardIds, hands } = params;

  let requesterHand = [...hands[requesterPosition]];
  let partnerHand = [...hands[partnerPosition]];
  const requestedCards: Card[] = [];
  const returnedCards: Card[] = [];

  // Move requested cards from partner → requester
  for (const cardId of requestedCardIds) {
    const [newPartnerHand, card] = removeCardFromHand(partnerHand, cardId);
    if (!card) throw new Error(`Card ${cardId} not found in partner's hand`);
    partnerHand = newPartnerHand;
    requesterHand.push(card);
    requestedCards.push(card);
  }

  // Move return cards from requester → partner
  for (const cardId of returnCardIds) {
    const [newRequesterHand, card] = removeCardFromHand(requesterHand, cardId);
    if (!card) throw new Error(`Card ${cardId} not found in requester's hand`);
    requesterHand = newRequesterHand;
    partnerHand.push(card);
    returnedCards.push(card);
  }

  return {
    hands: {
      ...hands,
      [requesterPosition]: requesterHand,
      [partnerPosition]: partnerHand,
    },
    exchangedCards: { requested: requestedCards, returned: returnedCards },
  };
}

/**
 * Restore original hands after a Full Court cancel.
 */
export function cancelCardExchange(params: {
  requesterPosition: Position;
  partnerPosition: Position;
  requestedCards: Card[];
  returnedCards: Card[];
  hands: Hands;
}): Hands {
  const { requesterPosition, partnerPosition, requestedCards, returnedCards, hands } = params;

  let requesterHand = [...hands[requesterPosition]];
  let partnerHand = [...hands[partnerPosition]];

  // Undo: move requested cards back from requester → partner
  for (const card of requestedCards) {
    const [newHand] = removeCardFromHand(requesterHand, card.id);
    requesterHand = newHand;
    partnerHand.push(card);
  }

  // Undo: move returned cards back from partner → requester
  for (const card of returnedCards) {
    const [newHand] = removeCardFromHand(partnerHand, card.id);
    partnerHand = newHand;
    requesterHand.push(card);
  }

  return {
    ...hands,
    [requesterPosition]: requesterHand,
    [partnerPosition]: partnerHand,
  };
}

// ─── Active Players in Court ──────────────────────────────────────────────────

/**
 * Get the 3 active player positions during a court round.
 * The inactive player is the requester's partner.
 */
export function getCourtActivePlayers(requesterPosition: Position): {
  activePlayers: Position[];
  inactivePlayer: Position;
} {
  const inactivePlayer = getPartnerPosition(requesterPosition);
  const activePlayers = ([0, 1, 2, 3] as Position[]).filter((p) => p !== inactivePlayer);
  return { activePlayers, inactivePlayer };
}

/**
 * Determine next turn position in a court (3 player) round.
 * Skip the inactive player.
 */
export function nextCourtTurn(currentTurn: Position, inactivePlayer: Position): Position {
  let next = ((currentTurn + 3) % 4) as Position; // counter-clockwise
  if (next === inactivePlayer) {
    next = ((next + 3) % 4) as Position; // skip inactive
  }
  return next;
}
