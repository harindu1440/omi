/**
 * deck.ts — Server-only deck generation and shuffle
 *
 * NEVER import this on the client side.
 * Uses Fisher-Yates shuffle with crypto-quality randomness.
 */

import { Card, Suit, Rank, SUITS, RANKS } from '@/types/game';

/** Generate a complete 32-card Omi deck */
export function generateDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      const suitCode = suit[0].toUpperCase(); // S, H, D, C
      const rankCode = rank;
      deck.push({
        id: `${rankCode}${suitCode}`,
        suit,
        rank,
      });
    }
  }
  return deck;
}

/**
 * Fisher-Yates shuffle using crypto.getRandomValues for server randomness.
 * Returns a new shuffled array; does not mutate the original.
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const arr = [...deck];
  const randomValues = new Uint32Array(arr.length);
  crypto.getRandomValues(randomValues);

  for (let i = arr.length - 1; i > 0; i--) {
    // Use modulo to map 32-bit random value to valid index range
    const j = randomValues[i] % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Generate a fresh shuffled 32-card deck */
export function freshShuffledDeck(): Card[] {
  return shuffleDeck(generateDeck());
}

/** Find a card by its id in a hand or deck */
export function findCard(cards: Card[], cardId: string): Card | undefined {
  return cards.find((c) => c.id === cardId);
}

/** Remove a card from a hand by id. Returns [newHand, removedCard] */
export function removeCardFromHand(hand: Card[], cardId: string): [Card[], Card | null] {
  const idx = hand.findIndex((c) => c.id === cardId);
  if (idx === -1) return [hand, null];
  const newHand = [...hand];
  const [removed] = newHand.splice(idx, 1);
  return [newHand, removed];
}

/** Card ID helper for parsing */
export function parseCardId(id: string): { rank: Rank; suit: Suit } | null {
  const suitMap: Record<string, Suit> = {
    S: 'spades',
    H: 'hearts',
    D: 'diamonds',
    C: 'clubs',
  };
  const suitChar = id.slice(-1);
  const rankStr = id.slice(0, -1);
  const suit = suitMap[suitChar];
  if (!suit) return null;
  if (!(RANKS as string[]).includes(rankStr)) return null;
  return { rank: rankStr as Rank, suit };
}
