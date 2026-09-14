import { describe, it, expect } from 'vitest';
import { dealFirstFour, dealRemainingFour } from '../dealing';
import { freshShuffledDeck } from '../deck';

describe('Dealing Logic', () => {
  it('dealFirstFour should distribute 4 cards to all 4 players and leave 16 in deck', () => {
    const deck = freshShuffledDeck();
    const dealerPosition = 0;
    
    const { hands, remainingDeck } = dealFirstFour(deck, dealerPosition);
    
    expect(remainingDeck).toHaveLength(16);
    expect(hands[0]).toHaveLength(4);
    expect(hands[1]).toHaveLength(4);
    expect(hands[2]).toHaveLength(4);
    expect(hands[3]).toHaveLength(4);
  });

  it('dealRemainingFour should distribute the last 16 cards so everyone has 8', () => {
    const deck = freshShuffledDeck();
    const dealerPosition = 0;
    
    const firstDeal = dealFirstFour(deck, dealerPosition);
    const { hands, remainingDeck } = dealRemainingFour(
      firstDeal.remainingDeck,
      firstDeal.hands,
      dealerPosition
    );
    
    expect(remainingDeck).toHaveLength(0);
    expect(hands[0]).toHaveLength(8);
    expect(hands[1]).toHaveLength(8);
    expect(hands[2]).toHaveLength(8);
    expect(hands[3]).toHaveLength(8);
  });
});
