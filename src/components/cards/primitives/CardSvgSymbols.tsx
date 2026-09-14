'use client';
/**
 * CardSvgSymbols.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared suit symbols and corner index components used by Card and CardBack.
 * Uses Unicode characters for crisp rendering at any DPI/size.
 */

import React from 'react';
import { Suit } from '@/types/game';

// ── Constants ─────────────────────────────────────────────────────────────────

export const SUIT_UNICODE: Record<Suit, string> = {
  spades:   '♠',
  hearts:   '♥',
  diamonds: '♦',
  clubs:    '♣',
};

export const SUIT_COLOR: Record<Suit, string> = {
  spades:   '#1a1a2e',
  hearts:   '#c0392b',
  diamonds: '#c0392b',
  clubs:    '#1a1a2e',
};

export const IS_RED: Record<Suit, boolean> = {
  spades:   false,
  hearts:   true,
  diamonds: true,
  clubs:    false,
};

// ── SuitSymbol ────────────────────────────────────────────────────────────────

interface SuitSymbolProps {
  suit: Suit;
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}

export function SuitSymbol({ suit, size = 24, style, className }: SuitSymbolProps) {
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        color:        SUIT_COLOR[suit],
        fontSize:     size,
        lineHeight:   1,
        display:      'inline-block',
        userSelect:   'none',
        // Serif font is crucial for correct suit unicode rendering
        fontFamily:   '"Georgia", "Times New Roman", serif',
        ...style,
      }}
    >
      {SUIT_UNICODE[suit]}
    </span>
  );
}

// ── CardCorner ────────────────────────────────────────────────────────────────
// Stacked rank + suit shown in card corners.

interface CardCornerProps {
  rank:      string;
  suit:      Suit;
  inverted?: boolean;   // true for bottom-right corner (180° rotated)
  fontSize?: number;    // rank font size in px
}

export function CardCorner({ rank, suit, inverted = false, fontSize = 13 }: CardCornerProps) {
  const color   = SUIT_COLOR[suit];
  const sym     = SUIT_UNICODE[suit];
  const suitSz  = Math.max(8, fontSize - 3);

  return (
    <div
      aria-hidden="true"
      style={{
        transform:      inverted ? 'rotate(180deg)' : undefined,
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        lineHeight:     1,
        color,
        userSelect:     'none',
        gap:            '1px',
      }}
    >
      {/* Rank */}
      <span style={{
        fontSize,
        fontFamily:    '"Georgia", "Times New Roman", serif',
        fontWeight:    700,
        letterSpacing: '-0.03em',
        lineHeight:    1.1,
      }}>
        {rank}
      </span>
      {/* Suit */}
      <span style={{
        fontSize:   suitSz,
        fontFamily: '"Georgia", "Times New Roman", serif',
        lineHeight: 1,
      }}>
        {sym}
      </span>
    </div>
  );
}
