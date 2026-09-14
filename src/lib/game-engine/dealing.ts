/**
 * dealing.ts — Server-only card dealing logic
 *
 * NEVER import this on the client side.
 * Handles deal order (counter-clockwise from dealer's right).
 */

import { Card, Position } from '@/types/game';

export type Hands = Record<Position, Card[]>;

/**
 * Deal `count` cards to each player, starting counter-clockwise from `startPosition`.
 * Removes dealt cards from the deck in-place (mutates deck array).
 * Returns the updated hands.
 */
export function dealCards(
  deck: Card[],
  hands: Hands,
  startPosition: Position,
  count: number,
): Hands {
  const newHands: Hands = {
    0: [...hands[0]],
    1: [...hands[1]],
    2: [...hands[2]],
    3: [...hands[3]],
  };

  // Deal one card at a time to each player, counter-clockwise
  for (let round = 0; round < count; round++) {
    for (let i = 0; i < 4; i++) {
      const pos = ((startPosition + i * 3) % 4) as Position;
      // Counter-clockwise: subtract 1 mod 4 (i.e. +3 mod 4)
      const targetPos = ((startPosition + i) % 4) as Position;
      const card = deck.shift();
      if (!card) throw new Error('Deck exhausted during deal');
      newHands[targetPos].push(card);
    }
  }

  return newHands;
}

/**
 * Deal first 4 cards to each player.
 * In Omi, dealing starts with the player to the dealer's right (counter-clockwise).
 * dealerPosition: the dealer; first recipient = (dealerPosition + 3) % 4 (right of dealer CCW)
 */
export function dealFirstFour(deck: Card[], dealerPosition: Position): { hands: Hands; remainingDeck: Card[] } {
  const mutableDeck = [...deck];
  const hands: Hands = { 0: [], 1: [], 2: [], 3: [] };

  // First recipient is to the right of the dealer in counter-clockwise play
  // CCW: 0→3→2→1→0, so "right of dealer" = (dealer + 3) % 4
  const startPos = ((dealerPosition + 3) % 4) as Position;

  // Deal 4 cards each: one round per card position
  for (let i = 0; i < 4; i++) {
    for (let p = 0; p < 4; p++) {
      const pos = ((startPos + p) % 4) as Position;
      const card = mutableDeck.shift();
      if (!card) throw new Error('Deck exhausted during first deal');
      hands[pos].push(card);
    }
  }

  return { hands, remainingDeck: mutableDeck };
}

/**
 * Deal remaining 4 cards to each player.
 * Same deal order as first deal.
 */
export function dealRemainingFour(
  deck: Card[],
  hands: Hands,
  dealerPosition: Position,
): { hands: Hands; remainingDeck: Card[] } {
  const mutableDeck = [...deck];
  const newHands: Hands = {
    0: [...hands[0]],
    1: [...hands[1]],
    2: [...hands[2]],
    3: [...hands[3]],
  };

  const startPos = ((dealerPosition + 3) % 4) as Position;

  for (let i = 0; i < 4; i++) {
    for (let p = 0; p < 4; p++) {
      const pos = ((startPos + p) % 4) as Position;
      const card = mutableDeck.shift();
      if (!card) throw new Error('Deck exhausted during second deal');
      newHands[pos].push(card);
    }
  }

  return { hands: newHands, remainingDeck: mutableDeck };
}

/**
 * Get the trump caller position.
 * Trump caller = player to the right of the dealer (first to receive cards).
 */
export function getTrumpCallerPosition(dealerPosition: Position): Position {
  return ((dealerPosition + 3) % 4) as Position;
}

/**
 * Next dealer: rotates counter-clockwise (dealer moves to the right CCW).
 */
export function nextDealerPosition(currentDealer: Position): Position {
  return ((currentDealer + 3) % 4) as Position;
}

/** Return only the card ids from a hand (for safe logging) */
export function handCardIds(hand: Card[]): string[] {
  return hand.map((c) => c.id);
}
