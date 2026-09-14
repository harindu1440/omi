// ─── Card Primitives ─────────────────────────────────────────────────────────

export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank = 'A' | 'K' | 'Q' | 'J' | '10' | '9' | '8' | '7';

export interface Card {
  id: string; // e.g. "AS", "KH", "10D", "7C"
  suit: Suit;
  rank: Rank;
}

export const RANK_ORDER: Record<Rank, number> = {
  A: 8,
  K: 7,
  Q: 6,
  J: 5,
  '10': 4,
  '9': 3,
  '8': 2,
  '7': 1,
};

export const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
export const RANKS: Rank[] = ['A', 'K', 'Q', 'J', '10', '9', '8', '7'];

// ─── Game Phases ─────────────────────────────────────────────────────────────

export type GamePhase =
  | 'waiting'
  | 'dealing_first'       // dealing first 4 cards
  | 'trump_selection'     // trump caller picks suit
  | 'dealing_rest'        // dealing remaining 4 cards
  | 'court_window'        // brief window: half court can be called
  | 'half_court_pending'  // half court requested, waiting confirmation
  | 'full_court_pending'  // full court requested, card exchange in progress
  | 'full_court_decide'   // requester decides to accept or cancel
  | 'playing'             // normal 8-trick play
  | 'half_court_playing'  // 3-player 4-trick play
  | 'full_court_playing'  // 3-player 8-trick play
  | 'round_end'           // round finished, showing results
  | 'match_end';          // match finished

// ─── Court Types ─────────────────────────────────────────────────────────────

export type CourtType = 'none' | 'half' | 'full';

// ─── Player Positions ─────────────────────────────────────────────────────────
// Counter-clockwise: 0=bottom, 1=right, 2=top, 3=left

export type Position = 0 | 1 | 2 | 3;
export type Team = 0 | 1;

export function positionToTeam(position: Position): Team {
  return (position % 2) as Team;
}

export function getPartnerPosition(position: Position): Position {
  return ((position + 2) % 4) as Position;
}

// Counter-clockwise next position
export function nextPosition(position: Position): Position {
  return ((position + 3) % 4) as Position;
}

// ─── Card Play in a Trick ─────────────────────────────────────────────────────

export interface CardPlay {
  position: Position;
  card: Card;
  playedAt: string; // ISO timestamp
}

export interface Trick {
  trickNumber: number; // 1-indexed
  ledSuit: Suit | null;
  plays: CardPlay[];
  winnerPosition: Position | null;
  winnerTeam: Team | null;
}

// ─── Katakola (Token) State ───────────────────────────────────────────────────

export interface KatakolaState {
  team0: number; // tokens remaining for team 0
  team1: number; // tokens remaining for team 1
  bonusPool: number; // unclaimed bonus from Saporu (4-4 tie)
}

// ─── Full Court Card Exchange ─────────────────────────────────────────────────

export interface CardExchangeState {
  requestedCardIds: string[];   // 2 card ids requester wants from partner
  givenCards: Card[];           // cards teammate gave
  returnedCardIds: string[];    // 2 card ids requester gives back
  exchangeComplete: boolean;
}

// ─── Katakola Transfer Animation ────────────────────────────────────────────────
export interface KatakolaTransaction {
  amount: number;
  fromTeam: Team;
  toTeam: Team;
  reason: RoundOutcome;
}

// ─── Scoring Rules Configuration ──────────────────────────────────────────────
export interface ScoringRules {
  saporuBonus: number;
  kapothiWin: number;
  kapothiLoss: number;
  halfCourt: number;
  fullCourt: number;
  normalWin: number;
  brokenCall: number;
}

// ─── Round Scoring Result ─────────────────────────────────────────────────────

export type RoundOutcome =
  | 'caller_wins'       // trump caller's team wins 5-7 tricks
  | 'call_broken'       // opposing team wins 5+ tricks
  | 'saporu'            // 4-4 tie
  | 'kapothi_success'   // announced kapothi, swept all 8
  | 'kapothi_failed'    // announced kapothi, lost a trick
  | 'half_court_won'    // half court requester won
  | 'half_court_lost'   // half court requester lost
  | 'full_court_won'    // full court requester won
  | 'full_court_lost';  // full court requester lost

export interface RoundResult {
  outcome: RoundOutcome;
  tricksTeam0: number;
  tricksTeam1: number;
  katakolaChange: number; // how many tokens changed hands
  losingTeam: Team | null;
  winningTeam: Team | null;
  katakolaBefore: KatakolaState;
  katakolaAfter: KatakolaState;
  transaction: KatakolaTransaction | null; // Used for frontend animations
  courtType: CourtType;
}

// ─── Public Game State (safe to send to clients) ──────────────────────────────

export interface PublicPlayerState {
  userId: string;
  username: string;
  position: Position;
  team: Team;
  cardCount: number;       // how many cards they hold (not which cards)
  isConnected: boolean;
  isActive: boolean;       // false when sitting out a court round
}

export interface CurrentTrickState {
  trickNumber: number;
  plays: CardPlay[];       // visible to all
  ledSuit: Suit | null;
  currentTurn: Position;
  tricksTeam0: number;
  tricksTeam1: number;
}

export interface PublicGameState {
  gameId: string;
  phase: GamePhase;
  players: PublicPlayerState[];
  trumpSuit: Suit | null;
  trumpCallerPosition: Position | null;
  dealerPosition: Position;
  currentTrick: CurrentTrickState | null;
  completedTricks: Trick[];
  katakola: KatakolaState;
  roundResult: RoundResult | null;
  courtType: CourtType;
  courtRequesterPosition: Position | null;
  courtTrumpSuit: Suit | null;
  inactivePlayerPosition: Position | null;
  kapothi: {
    announced: boolean;
    eligible: boolean;
  };
  cardExchangePhase: 'requesting' | 'partner_choosing' | 'requester_deciding' | 'done' | null;
  roundNumber: number;
  matchWinner: Team | null;
}

// ─── Private Player State (sent only to that player) ─────────────────────────

export interface PrivatePlayerState {
  hand: Card[];
  legalPlays: string[]; // card ids legal to play right now
}

// ─── Realtime Broadcast Payloads ─────────────────────────────────────────────

export type BroadcastEvent =
  | { type: 'game_state'; state: PublicGameState }
  | { type: 'player_hand'; hand: Card[]; legalPlays: string[] }
  | { type: 'trick_result'; trick: Trick; nextTurn: Position }
  | { type: 'round_end'; result: RoundResult }
  | { type: 'dealer_action'; action: 'wash' | 'shuffle' | 'cut'; dealerPosition: Position };

