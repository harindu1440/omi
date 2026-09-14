/**
 * scoring.ts — Server-only Katakola scoring logic
 *
 * Implements the local rule modifications:
 * - Saporu: bonus 2 Katakola banked, awarded to next round winner
 * - Kapothi success: 3 Katakola
 * - Kapothi failure: 4 Katakola to opponent
 * - Half/Full court win: 3 Katakola
 * - Normal win: 1 Katakola (caller team)
 * - Broken call: 2 Katakola (non-caller team)
 *
 * NEVER import this on the client side.
 */

import {
  KatakolaState,
  RoundResult,
  RoundOutcome,
  Team,
  Position,
  positionToTeam,
  ScoringRules,
  KatakolaTransaction,
} from '@/types/game';

const INITIAL_KATAKOLA = 10;

export const SCORING_RULES: ScoringRules = {
  saporuBonus: 2,
  kapothiWin: 3,
  kapothiLoss: 4,
  halfCourt: 3,
  fullCourt: 3,
  normalWin: 1,
  brokenCall: 2,
};

export function initialKatakolaState(): KatakolaState {
  return { team0: INITIAL_KATAKOLA, team1: INITIAL_KATAKOLA, bonusPool: 0 };
}

/**
 * Transfer `amount` Katakola from `losingTeam` to `winningTeam`.
 * A team cannot go below 0 (clamp).
 */
function transferKatakola(
  state: KatakolaState,
  losingTeam: Team,
  amount: number,
): KatakolaState {
  const newState = { ...state };
  const winningTeam = losingTeam === 0 ? 1 : 0;
  
  if (losingTeam === 0) {
    const actualTransfer = Math.min(newState.team0, amount);
    newState.team0 -= actualTransfer;
    newState.team1 += actualTransfer;
  } else {
    const actualTransfer = Math.min(newState.team1, amount);
    newState.team1 -= actualTransfer;
    newState.team0 += actualTransfer;
  }
  return newState;
}

/**
 * Calculate the round result and new Katakola state for a normal Omi round.
 *
 * @param tricks8  - array of all 8 completed tricks
 * @param trumpCallerPosition - position of the trump caller
 * @param kapothiAnnounced - whether Kapothi was announced after trick 6
 * @param katakola - current Katakola state before this round
 */
export function calculateNormalRoundResult(params: {
  tricksTeam0: number;
  tricksTeam1: number;
  trumpCallerTeam: Team;
  kapothiAnnounced: boolean;
  katakola: KatakolaState;
}): RoundResult {
  const { tricksTeam0, tricksTeam1, trumpCallerTeam, kapothiAnnounced, katakola } = params;
  const opponentTeam: Team = trumpCallerTeam === 0 ? 1 : 0;
  const katakolaBefore = { ...katakola };
  let outcome: RoundOutcome;
  let katakolaChange = 0;
  let losingTeam: Team | null = null;
  let winningTeam: Team | null = null;

  const callerTricks = trumpCallerTeam === 0 ? tricksTeam0 : tricksTeam1;
  const opponentTricks = trumpCallerTeam === 0 ? tricksTeam1 : tricksTeam0;

  if (tricksTeam0 === 4 && tricksTeam1 === 4) {
    // Saporu — 4-4 tie: bank bonus Katakola
    outcome = 'saporu';
    katakolaChange = 0;
    losingTeam = null;
    winningTeam = null;
  } else if (kapothiAnnounced) {
    if (callerTricks === 8) {
      // Kapothi success
      outcome = 'kapothi_success';
      katakolaChange = SCORING_RULES.kapothiWin;
      losingTeam = opponentTeam;
      winningTeam = trumpCallerTeam;
    } else {
      // Kapothi failed
      outcome = 'kapothi_failed';
      katakolaChange = SCORING_RULES.kapothiLoss;
      losingTeam = trumpCallerTeam;
      winningTeam = opponentTeam;
    }
  } else if (callerTricks >= 5) {
    // Caller's team wins (5, 6, or 7 tricks)
    outcome = 'caller_wins';
    katakolaChange = SCORING_RULES.normalWin;
    losingTeam = opponentTeam;
    winningTeam = trumpCallerTeam;
  } else {
    // Opponent breaks the call (5+ tricks)
    outcome = 'call_broken';
    katakolaChange = SCORING_RULES.brokenCall;
    losingTeam = trumpCallerTeam;
    winningTeam = opponentTeam;
  }

  let katakolaAfter = { ...katakolaBefore };

  if (outcome === 'saporu') {
    // Bank the bonus Katakola — will be added to next winner's award
    katakolaAfter.bonusPool += SCORING_RULES.saporuBonus;
  } else if (losingTeam !== null) {
    // Apply bonus pool from previous Saporu to the winner
    const totalChange = katakolaChange + katakolaAfter.bonusPool;
    katakolaAfter.bonusPool = 0;
    katakolaAfter = transferKatakola(katakolaAfter, losingTeam, totalChange);
    katakolaChange = totalChange;
  }

  const transaction: KatakolaTransaction | null = winningTeam !== null && losingTeam !== null && katakolaChange > 0
    ? { amount: katakolaChange, fromTeam: losingTeam, toTeam: winningTeam, reason: outcome }
    : null;

  return {
    outcome,
    tricksTeam0,
    tricksTeam1,
    katakolaChange,
    losingTeam,
    winningTeam,
    katakolaBefore,
    katakolaAfter,
    transaction,
    courtType: 'none',
  };
}

/**
 * Calculate the round result for a Half Court round.
 * Half Court: 4 tricks, 3 players.
 * Requester's team needs to win more than opponents.
 */
export function calculateHalfCourtResult(params: {
  tricksRequesterTeam: number; // out of 4
  tricksOpponentTeam: number;  // out of 4
  requesterTeam: Team;
  katakola: KatakolaState;
}): RoundResult {
  const { tricksRequesterTeam, tricksOpponentTeam, requesterTeam, katakola } = params;
  const opponentTeam: Team = requesterTeam === 0 ? 1 : 0;
  const katakolaBefore = { ...katakola };

  const won = tricksRequesterTeam > tricksOpponentTeam;
  const outcome: RoundOutcome = won ? 'half_court_won' : 'half_court_lost';
  const katakolaChange = SCORING_RULES.halfCourt;
  const losingTeam: Team = won ? opponentTeam : requesterTeam;
  const winningTeam: Team = won ? requesterTeam : opponentTeam;

  let katakolaAfter = { ...katakolaBefore };
  const totalChange = katakolaChange + katakolaAfter.bonusPool;
  katakolaAfter.bonusPool = 0;
  katakolaAfter = transferKatakola(katakolaAfter, losingTeam, totalChange);

  // Map back to team0/team1 for trick counts
  const tricksTeam0 = requesterTeam === 0 ? tricksRequesterTeam : tricksOpponentTeam;
  const tricksTeam1 = requesterTeam === 1 ? tricksRequesterTeam : tricksOpponentTeam;

  const transaction: KatakolaTransaction | null = totalChange > 0
    ? { amount: totalChange, fromTeam: losingTeam, toTeam: winningTeam, reason: outcome }
    : null;

  return {
    outcome,
    tricksTeam0,
    tricksTeam1,
    katakolaChange: totalChange,
    losingTeam,
    winningTeam,
    katakolaBefore,
    katakolaAfter,
    transaction,
    courtType: 'half',
  };
}

/**
 * Calculate the round result for a Full Court round.
 * Full Court: 8 tricks, 3 players.
 * Requester's team needs majority (5+) to win.
 */
export function calculateFullCourtResult(params: {
  tricksRequesterTeam: number; // out of 8
  tricksOpponentTeam: number;  // out of 8
  requesterTeam: Team;
  katakola: KatakolaState;
}): RoundResult {
  const { tricksRequesterTeam, tricksOpponentTeam, requesterTeam, katakola } = params;
  const opponentTeam: Team = requesterTeam === 0 ? 1 : 0;
  const katakolaBefore = { ...katakola };

  const won = tricksRequesterTeam >= 5;
  const outcome: RoundOutcome = won ? 'full_court_won' : 'full_court_lost';
  const katakolaChange = SCORING_RULES.fullCourt;
  const losingTeam: Team = won ? opponentTeam : requesterTeam;
  const winningTeam: Team = won ? requesterTeam : opponentTeam;

  let katakolaAfter = { ...katakolaBefore };
  const totalChange = katakolaChange + katakolaAfter.bonusPool;
  katakolaAfter.bonusPool = 0;
  katakolaAfter = transferKatakola(katakolaAfter, losingTeam, totalChange);

  const tricksTeam0 = requesterTeam === 0 ? tricksRequesterTeam : tricksOpponentTeam;
  const tricksTeam1 = requesterTeam === 1 ? tricksRequesterTeam : tricksOpponentTeam;

  const transaction: KatakolaTransaction | null = totalChange > 0
    ? { amount: totalChange, fromTeam: losingTeam, toTeam: winningTeam, reason: outcome }
    : null;

  return {
    outcome,
    tricksTeam0,
    tricksTeam1,
    katakolaChange: totalChange,
    losingTeam,
    winningTeam,
    katakolaBefore,
    katakolaAfter,
    transaction,
    courtType: 'full',
  };
}

/**
 * Check if a team has won the match (reached 0 Katakola).
 */
export function checkMatchEnd(katakola: KatakolaState): Team | null {
  if (katakola.team0 <= 0) return 0;
  if (katakola.team1 <= 0) return 1;
  return null;
}
