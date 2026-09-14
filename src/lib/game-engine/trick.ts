/**
 * trick.ts — Server-only trick resolution logic
 *
 * Handles follow-suit validation, legal play determination, and trick winner calculation.
 * NEVER import this on the client side.
 */

import { Card, CardPlay, Position, Suit, Trick, Team, RANK_ORDER, positionToTeam } from '@/types/game';
import { Hands } from './dealing';

/**
 * Determine if a card play is legal given the current trick state and the player's hand.
 */
export function isLegalPlay(
  card: Card,
  hand: Card[],
  ledSuit: Suit | null,
  trumpSuit: Suit | null,
): boolean {
  // If no card has been led yet, any card is legal
  if (ledSuit === null) return true;

  // Check if player has any cards of the led suit
  const hasSuit = hand.some((c) => c.suit === ledSuit);
  if (hasSuit) {
    // Must follow suit
    return card.suit === ledSuit;
  }

  // No led suit cards — can play anything (including trump or other suits)
  return true;
}

/**
 * Get all legal cards a player can play given the current trick state.
 */
export function getLegalPlays(
  hand: Card[],
  ledSuit: Suit | null,
  trumpSuit: Suit | null,
): Card[] {
  if (ledSuit === null) return hand; // Leader can play anything

  const suitCards = hand.filter((c) => c.suit === ledSuit);
  if (suitCards.length > 0) return suitCards; // Must follow suit

  return hand; // No led suit — play anything
}

/**
 * Get legal play card IDs.
 */
export function getLegalPlayIds(
  hand: Card[],
  ledSuit: Suit | null,
  trumpSuit: Suit | null,
): string[] {
  return getLegalPlays(hand, ledSuit, trumpSuit).map((c) => c.id);
}

/**
 * Determine the winner of a completed trick.
 * Rules:
 *   1. Highest trump wins if any trump was played.
 *   2. Otherwise, highest card of the led suit wins.
 */
export function determineTrickWinner(
  plays: CardPlay[],
  ledSuit: Suit,
  trumpSuit: Suit | null,
): { winnerPosition: Position; winnerTeam: Team } {
  let winner = plays[0];

  for (let i = 1; i < plays.length; i++) {
    const challenger = plays[i];
    winner = compareCards(winner, challenger, ledSuit, trumpSuit);
  }

  return {
    winnerPosition: winner.position,
    winnerTeam: positionToTeam(winner.position),
  };
}

/**
 * Compare two card plays and return the winning play.
 */
function compareCards(
  current: CardPlay,
  challenger: CardPlay,
  ledSuit: Suit,
  trumpSuit: Suit | null,
): CardPlay {
  const cIsTrump = trumpSuit !== null && current.card.suit === trumpSuit;
  const chIsTrump = trumpSuit !== null && challenger.card.suit === trumpSuit;
  const cIsLed = current.card.suit === ledSuit;
  const chIsLed = challenger.card.suit === ledSuit;

  // Both trump: higher rank wins
  if (cIsTrump && chIsTrump) {
    return RANK_ORDER[challenger.card.rank] > RANK_ORDER[current.card.rank]
      ? challenger
      : current;
  }

  // Challenger is trump, current is not: challenger wins
  if (chIsTrump && !cIsTrump) return challenger;

  // Current is trump, challenger is not: current wins
  if (cIsTrump && !chIsTrump) return current;

  // Neither is trump: compare led suit cards
  if (cIsLed && chIsLed) {
    return RANK_ORDER[challenger.card.rank] > RANK_ORDER[current.card.rank]
      ? challenger
      : current;
  }

  // Current is led suit, challenger is not (off-suit, non-trump): current wins
  if (cIsLed && !chIsLed) return current;

  // Challenger is led suit but current is not: challenger wins
  if (chIsLed && !cIsLed) return challenger;

  // Neither is trump or led suit: first played wins (no override)
  return current;
}

/**
 * Build a completed Trick object from plays.
 */
export function buildTrick(
  trickNumber: number,
  plays: CardPlay[],
  ledSuit: Suit,
  trumpSuit: Suit | null,
): Trick {
  if (plays.length !== 4) {
    throw new Error(`Trick must have 4 plays, got ${plays.length}`);
  }

  const { winnerPosition, winnerTeam } = determineTrickWinner(plays, ledSuit, trumpSuit);

  return {
    trickNumber,
    ledSuit,
    plays,
    winnerPosition,
    winnerTeam,
  };
}

/**
 * Build a 3-player court trick (only 3 plays).
 */
export function buildCourtTrick(
  trickNumber: number,
  plays: CardPlay[],
  ledSuit: Suit,
  trumpSuit: Suit | null,
): Trick {
  if (plays.length !== 3) {
    throw new Error(`Court trick must have 3 plays, got ${plays.length}`);
  }

  const { winnerPosition, winnerTeam } = determineTrickWinner(plays, ledSuit, trumpSuit);

  return {
    trickNumber,
    ledSuit,
    plays,
    winnerPosition,
    winnerTeam,
  };
}

/**
 * Count tricks won by each team from a list of completed tricks.
 */
export function countTricksByTeam(tricks: Trick[]): { team0: number; team1: number } {
  let team0 = 0;
  let team1 = 0;

  for (const trick of tricks) {
    if (trick.winnerTeam === 0) team0++;
    else if (trick.winnerTeam === 1) team1++;
  }

  return { team0, team1 };
}

/**
 * After trick 6, check if Kapothi is eligible (winning team swept first 6).
 */
export function isKapothiEligible(tricks: Trick[], leadingTeam: Team): boolean {
  if (tricks.length < 6) return false;
  // Check first 6 tricks all won by same team
  for (let i = 0; i < 6; i++) {
    if (tricks[i].winnerTeam !== leadingTeam) return false;
  }
  return true;
}
