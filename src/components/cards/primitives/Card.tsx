'use client';
/**
 * Card.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * High-quality playing card face component.
 * Renders a single face-up card with realistic proportions, correct typography,
 * suit symbols, shadows, texture and highlight.
 *
 * Uses Framer Motion for enter animations and respects prefers-reduced-motion.
 */

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Card as CardType } from '@/types/game';
import { CardCorner, SUIT_COLOR, SUIT_UNICODE } from './CardSvgSymbols';
import { CARD_SIZES, CardSize, CARD_ANIM } from '../config/animationConfig';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CardProps {
  card:           CardType;
  size?:          CardSize;
  isLegal?:       boolean;   // false → dimmed + no-pointer
  isSelected?:    boolean;   // lifted with gold ring
  isHighlighted?: boolean;   // trick winner glow
  onClick?:       () => void;
  style?:         React.CSSProperties;
  layoutId?:      string;    // Framer Motion shared layout id
  animateIn?:     boolean;   // play entrance animation
  'aria-label'?:  string;
}

const FACE_CARDS = new Set(['K', 'Q', 'J']);

// ── Center content variants ───────────────────────────────────────────────────

function AceCenter({ suit, cardH }: { suit: CardType['suit']; cardH: number }) {
  const color = SUIT_COLOR[suit];
  const sym   = SUIT_UNICODE[suit];
  const sz    = cardH * 0.38;          // Larger for Ace
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
      <span style={{
        fontSize:   sz,
        color,
        lineHeight: 1,
        fontFamily: 'Arial, "Times New Roman", serif', // Fallback to system fonts for standard emoji/glyphs
        filter:     `drop-shadow(0 2px 4px rgba(0,0,0,0.15))`,
      }}>
        {sym}
      </span>
    </div>
  );
}

function FaceCardCenter({ suit, rank, cardW, cardH }: {
  suit:  CardType['suit'];
  rank:  string;
  cardW: number;
  cardH: number;
}) {
  const color     = SUIT_COLOR[suit];
  const sym       = SUIT_UNICODE[suit];
  const rankSz    = cardH * 0.22;
  const suitSz    = cardH * 0.26;

  // Decorative face-card inner border frame
  return (
    <div style={{
      flex:           1,
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      position:       'relative',
      width:          '100%',
      height:         '100%',
    }}>
      {/* Inner decorative frame */}
      <div style={{
        position:  'absolute',
        inset:     '4px 6px',
        border:    `1px solid ${color}33`,
        borderRadius: 4,
        pointerEvents: 'none',
      }} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', position: 'relative', zIndex: 1 }}>
        <span style={{
          fontSize:   suitSz,
          color,
          lineHeight: 1,
          fontFamily: 'Arial, "Times New Roman", serif',
          textShadow: `0 1px 3px rgba(0,0,0,0.1)`,
        }}>
          {sym}
        </span>
        <span style={{
          fontSize:      rankSz,
          color,
          fontFamily:    '"Playfair Display", "Times New Roman", serif',
          fontWeight:    800,
          lineHeight:    0.9,
          letterSpacing: '-0.02em',
        }}>
          {rank}
        </span>
      </div>
      
      {/* Subtle decorative dot corners */}
      {[[-1,-1],[1,-1],[-1,1],[1,1]].map(([dx,dy], i) => (
        <div key={i} style={{
          position: 'absolute',
          width:    4, height: 4,
          borderRadius: '50%',
          background: `${color}40`,
          top:   dy < 0 ? 8  : 'auto',
          bottom: dy > 0 ? 8 : 'auto',
          left:  dx < 0 ? 10  : 'auto',
          right: dx > 0 ? 10 : 'auto',
        }} />
      ))}
    </div>
  );
}

function NumberCardCenter({ suit, rank, cardH }: {
  suit:  CardType['suit'];
  rank:  string;
  cardH: number;
}) {
  const color  = SUIT_COLOR[suit];
  const sym    = SUIT_UNICODE[suit];
  const suitSz = cardH * 0.25;
  const rankSz = cardH * 0.18;

  return (
    <div style={{
      flex:           1,
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      width:          '100%',
      height:         '100%',
      gap:            2,
    }}>
      <span style={{ fontSize: suitSz, color, lineHeight: 1, fontFamily: 'Arial, "Times New Roman", serif' }}>
        {sym}
      </span>
      <span style={{
        fontSize:   rankSz,
        color:      color,
        fontFamily: '"Playfair Display", "Times New Roman", serif',
        fontWeight: 700,
        lineHeight: 0.9,
      }}>
        {rank}
      </span>
    </div>
  );
}

// ── Paper texture SVG (data URI, lightweight) ─────────────────────────────────
const PAPER_TEXTURE_URL =
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E` +
  `%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E` +
  `%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E` +
  `%3Crect width='120' height='120' filter='url(%23n)' opacity='0.015'/%3E%3C/svg%3E")`;

// ── Card ──────────────────────────────────────────────────────────────────────

export function Card({
  card,
  size        = 'lg',
  isLegal     = true,
  isSelected  = false,
  isHighlighted = false,
  onClick,
  style,
  layoutId,
  animateIn   = false,
  'aria-label': ariaLabel,
}: CardProps) {
  const prefersReduced = useReducedMotion();
  const { width, height } = CARD_SIZES[size];
  const cornerFs = size === 'lg' ? 14 : size === 'md' ? 12 : 10;
  const pad      = size === 'lg' ? 6  : size === 'md' ? 5  : 4;

  // ── Dynamic styles ──────────────────────────────────────────────
  const translateY = isSelected ? CARD_ANIM.selected.lift : 0;

  const boxShadow = isHighlighted
    ? '0 12px 32px rgba(0,0,0,0.7), 0 0 0 2px var(--color-gold), 0 0 32px var(--color-gold-glow)'
    : isSelected
    ? '0 16px 40px rgba(0,0,0,0.8), 0 0 0 2px var(--color-gold), 0 0 24px var(--color-gold-glow)'
    : '0 4px 12px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3)';

  const enterVariants = prefersReduced
    ? {}
    : {
        initial: { scale: 0.9, opacity: 0, y: -20 },
        animate: { scale: 1,   opacity: 1, y: 0   },
      };

  return (
    <motion.div
      layoutId={layoutId}
      {...(animateIn ? enterVariants : {})}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      onClick={isLegal ? onClick : undefined}
      aria-label={ariaLabel ?? `${card.rank} of ${card.suit}`}
      role={onClick ? 'button' : undefined}
      style={{
        width,
        height,
        borderRadius:    12, // Slightly more rounded for premium feel
        background:      'var(--color-card-bg)',
        backgroundImage: PAPER_TEXTURE_URL,
        border:          '1px solid var(--color-card-border)',
        boxShadow,
        display:         'flex',
        flexDirection:   'column',
        padding:         pad,
        position:        'relative',
        overflow:        'hidden',
        cursor:          onClick ? (isLegal ? 'pointer' : 'not-allowed') : 'default',
        opacity:         isLegal ? 1 : 0.6,
        filter:          isLegal ? 'none' : 'grayscale(0.3)',
        userSelect:      'none',
        flexShrink:      0,
        transform:       `translateY(${translateY}px) ${isSelected ? 'scale(1.05)' : 'scale(1)'}`,
        transition:      prefersReduced
          ? 'none'
          : 'transform 0.2s cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 0.2s ease, opacity 0.2s ease',
        willChange:      'transform',
        ...style,
      }}
    >
      {/* Top edge highlight — simulates glossy coating catching light */}
      <div style={{
        position:     'absolute',
        top:          0,
        left:         0,
        right:        0,
        height:       1,
        background:   'linear-gradient(90deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.2) 100%)',
        borderRadius: '12px 12px 0 0',
        pointerEvents:'none',
      }} />
      
      {/* Subtle inner card border line for premium detail */}
      <div style={{
        position: 'absolute',
        inset: '3px',
        border: '1px solid rgba(0,0,0,0.03)',
        borderRadius: '9px',
        pointerEvents: 'none',
      }}/>

      {/* Top-left corner index */}
      <CardCorner rank={card.rank} suit={card.suit} fontSize={cornerFs} />

      {/* Center content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyItems: 'center', width: '100%' }}>
        {card.rank === 'A'
          ? <AceCenter      suit={card.suit} cardH={height} />
          : FACE_CARDS.has(card.rank)
          ? <FaceCardCenter suit={card.suit} rank={card.rank} cardW={width} cardH={height} />
          : <NumberCardCenter suit={card.suit} rank={card.rank} cardH={height} />
        }
      </div>

      {/* Bottom-right corner index (rotated 180°) */}
      <div style={{ alignSelf: 'flex-end', marginTop: 'auto' }}>
        <CardCorner rank={card.rank} suit={card.suit} inverted fontSize={cornerFs} />
      </div>

      {/* Illegal card darkening overlay */}
      {!isLegal && (
        <div style={{
          position:     'absolute',
          inset:        0,
          background:   'rgba(0,0,0,0.15)',
          borderRadius: 'inherit',
          pointerEvents:'none',
        }} />
      )}
    </motion.div>
  );
}
