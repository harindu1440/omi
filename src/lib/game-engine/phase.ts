/**
 * phase.ts — Game phase transition logic (server-only)
 *
 * All phase transitions go through this file.
 * The server is the sole authority on phase changes.
 */

import { GamePhase, CourtType } from '@/types/game';

/** Valid transitions from each phase */
const VALID_TRANSITIONS: Record<GamePhase, GamePhase[]> = {
  waiting:              ['dealing_first'],
  dealing_first:        ['trump_selection'],
  trump_selection:      ['dealing_rest', 'half_court_pending'],
  dealing_rest:         ['court_window', 'half_court_pending'],
  court_window:         ['playing', 'half_court_pending', 'full_court_pending'],
  half_court_pending:   ['half_court_playing'],
  full_court_pending:   ['full_court_decide'],
  full_court_decide:    ['full_court_playing', 'playing'],
  playing:              ['round_end'],
  half_court_playing:   ['round_end'],
  full_court_playing:   ['round_end'],
  round_end:            ['dealing_first', 'match_end'],
  match_end:            ['waiting'],
};

/** Check if a phase transition is valid */
export function isValidTransition(from: GamePhase, to: GamePhase): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Get the play phase for a given court type */
export function getPlayPhase(courtType: CourtType): GamePhase {
  switch (courtType) {
    case 'half': return 'half_court_playing';
    case 'full': return 'full_court_playing';
    default:     return 'playing';
  }
}

/** Whether the current phase allows playing cards */
export function isPlayingPhase(phase: GamePhase): boolean {
  return phase === 'playing' || phase === 'half_court_playing' || phase === 'full_court_playing';
}

/** Whether the current phase is a court exchange phase */
export function isExchangePhase(phase: GamePhase): boolean {
  return phase === 'full_court_pending' || phase === 'full_court_decide';
}

/** Human-readable phase labels */
export const PHASE_LABELS: Record<GamePhase, string> = {
  waiting:              'Waiting',
  dealing_first:        'Dealing Cards',
  trump_selection:      'Choosing Trump',
  dealing_rest:         'Dealing More Cards',
  court_window:         'Ready to Play',
  half_court_pending:   'Half Court Requested',
  full_court_pending:   'Full Court – Card Exchange',
  full_court_decide:    'Full Court – Decision',
  playing:              'Playing',
  half_court_playing:   'Half Court',
  full_court_playing:   'Full Court',
  round_end:            'Round Over',
  match_end:            'Match Over',
};
