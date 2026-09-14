import { describe, it, expect } from 'vitest';
import { 
  calculateNormalRoundResult, 
  calculateHalfCourtResult, 
  calculateFullCourtResult,
  initialKatakolaState,
  SCORING_RULES
} from '../scoring';

describe('Scoring Logic', () => {
  it('Normal win - Caller team gets 1 token', () => {
    const katakola = initialKatakolaState(); // 10/10
    const result = calculateNormalRoundResult({
      tricksTeam0: 5,
      tricksTeam1: 3,
      trumpCallerTeam: 0,
      kapothiAnnounced: false,
      katakola
    });
    
    expect(result.outcome).toBe('caller_wins');
    expect(result.katakolaAfter.team0).toBe(10 + SCORING_RULES.normalWin);
    expect(result.katakolaAfter.team1).toBe(10 - SCORING_RULES.normalWin);
  });

  it('Broken call - Non-caller team gets 2 tokens', () => {
    const katakola = initialKatakolaState();
    const result = calculateNormalRoundResult({
      tricksTeam0: 4, // 0 called
      tricksTeam1: 4, // 1 broke (Wait, 4-4 is Saporu, let's make it 3-5)
      trumpCallerTeam: 0,
      kapothiAnnounced: false,
      katakola
    });
    
    // Wait! 4-4 is Saporu in the new Omi rules, but if caller team gets 4 and opponent gets 4, it's Saporu.
    // If opponent gets 5, call is broken.
    const resultBreak = calculateNormalRoundResult({
      tricksTeam0: 3,
      tricksTeam1: 5,
      trumpCallerTeam: 0,
      kapothiAnnounced: false,
      katakola
    });
    
    expect(resultBreak.outcome).toBe('call_broken');
    expect(resultBreak.katakolaAfter.team1).toBe(10 + SCORING_RULES.brokenCall);
    expect(resultBreak.katakolaAfter.team0).toBe(10 - SCORING_RULES.brokenCall);
  });

  it('Saporu (4-4 tie) - Banks 2 tokens in bonus pool, no immediate winner', () => {
    const katakola = initialKatakolaState();
    const result = calculateNormalRoundResult({
      tricksTeam0: 4,
      tricksTeam1: 4,
      trumpCallerTeam: 0,
      kapothiAnnounced: false,
      katakola
    });
    
    expect(result.outcome).toBe('saporu');
    expect(result.katakolaAfter.bonusPool).toBe(SCORING_RULES.saporuBonus);
    expect(result.katakolaAfter.team0).toBe(10);
    expect(result.katakolaAfter.team1).toBe(10);
  });

  it('Half Court - Win awards 3 tokens', () => {
    const katakola = initialKatakolaState();
    const result = calculateHalfCourtResult({
      tricksRequesterTeam: 3, // out of 4
      tricksOpponentTeam: 1,
      requesterTeam: 1,
      katakola
    });
    
    expect(result.outcome).toBe('half_court_won');
    expect(result.katakolaAfter.team1).toBe(10 + SCORING_RULES.halfCourt);
    expect(result.katakolaAfter.team0).toBe(10 - SCORING_RULES.halfCourt);
  });
});
