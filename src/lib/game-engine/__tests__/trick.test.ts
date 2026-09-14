import { describe, it, expect } from 'vitest';
import { isLegalPlay, determineTrickWinner, countTricksByTeam, isKapothiEligible } from '../trick';
import { Card, CardPlay, Trick } from '@/types/game';

describe('Trick Logic', () => {
  const S_A: Card = { id: 'AS', suit: 'spades', rank: 'A' };
  const S_K: Card = { id: 'KS', suit: 'spades', rank: 'K' };
  const H_10: Card = { id: '10H', suit: 'hearts', rank: '10' };
  const H_A: Card = { id: 'AH', suit: 'hearts', rank: 'A' };
  const D_7: Card = { id: '7D', suit: 'diamonds', rank: '7' };

  it('isLegalPlay - follow suit if possible', () => {
    const hand = [S_A, H_10, D_7];
    // Led suit is spades, must play S_A
    expect(isLegalPlay(S_A, hand, 'spades', 'diamonds')).toBe(true);
    expect(isLegalPlay(H_10, hand, 'spades', 'diamonds')).toBe(false);
  });

  it('isLegalPlay - play anything if out of suit', () => {
    const hand = [H_10, D_7];
    // Led suit is spades, hand has no spades, any card is legal
    expect(isLegalPlay(H_10, hand, 'spades', 'diamonds')).toBe(true);
    expect(isLegalPlay(D_7, hand, 'spades', 'diamonds')).toBe(true);
  });

  it('isLegalPlay - lead trick', () => {
    const hand = [S_A, H_10, D_7];
    expect(isLegalPlay(S_A, hand, null, 'diamonds')).toBe(true);
  });

  it('determineTrickWinner - highest trump wins', () => {
    const plays: CardPlay[] = [
      { position: 0, card: S_A, playedAt: '' }, // Led non-trump
      { position: 1, card: S_K, playedAt: '' },
      { position: 2, card: D_7, playedAt: '' }, // Played trump
      { position: 3, card: H_10, playedAt: '' }, // Played off-suit
    ];
    // Diamonds is trump
    const winner = determineTrickWinner(plays, 'spades', 'diamonds');
    expect(winner.winnerPosition).toBe(2);
  });

  it('determineTrickWinner - highest led suit wins if no trump', () => {
    const plays: CardPlay[] = [
      { position: 0, card: S_K, playedAt: '' },
      { position: 1, card: S_A, playedAt: '' },
      { position: 2, card: D_7, playedAt: '' },
    ];
    // Hearts is trump, but no hearts played. Spades led.
    // S_A beats S_K.
    const winner = determineTrickWinner(plays, 'spades', 'hearts');
    expect(winner.winnerPosition).toBe(1);
  });
  
  it('countTricksByTeam', () => {
    const trickA = { winnerTeam: 0 } as Trick;
    const trickB = { winnerTeam: 0 } as Trick;
    const trickC = { winnerTeam: 1 } as Trick;
    const trickD = { winnerTeam: 1 } as Trick;
    const trickE = { winnerTeam: 1 } as Trick;
    
    const counts = countTricksByTeam([trickA, trickB, trickC, trickD, trickE]);
    expect(counts.team0).toBe(2);
    expect(counts.team1).toBe(3);
  });

  it('isKapothiEligible - true if swept first 6', () => {
    const tricks = Array(6).fill({ winnerTeam: 0 } as Trick);
    expect(isKapothiEligible(tricks, 0)).toBe(true);
  });

  it('isKapothiEligible - false if lost a trick', () => {
    const tricks = Array(6).fill({ winnerTeam: 0 } as Trick);
    tricks[2] = { winnerTeam: 1 } as Trick; // Team 1 won trick 3
    expect(isKapothiEligible(tricks, 0)).toBe(false);
  });
});
