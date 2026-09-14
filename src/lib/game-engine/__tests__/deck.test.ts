import { describe, it, expect } from 'vitest';
import { freshShuffledDeck } from '../deck';
import { SUITS, RANKS } from '@/types/game';

describe('Deck Logic', () => {
  it('should generate exactly 32 cards', () => {
    const deck = freshShuffledDeck();
    expect(deck).toHaveLength(32);
  });

  it('should have no duplicate cards', () => {
    const deck = freshShuffledDeck();
    const uniqueIds = new Set(deck.map(c => c.id));
    expect(uniqueIds.size).toBe(32);
  });

  it('should contain all expected ranks and suits', () => {
    const deck = freshShuffledDeck();
    
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        const found = deck.find(c => c.suit === suit && c.rank === rank);
        expect(found).toBeDefined();
      }
    }
  });

  it('should be randomized', () => {
    const deck1 = freshShuffledDeck();
    const deck2 = freshShuffledDeck();
    
    // Very small chance they match perfectly if randomly shuffled
    const isSameOrder = deck1.every((c, i) => c.id === deck2[i].id);
    expect(isSameOrder).toBe(false);
  });
});
