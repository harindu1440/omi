'use client';
/**
 * CardBack.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Premium card back component with ornate SVG trellis pattern.
 * Consistent across all card backs in the game (opponents, deck stack, etc.)
 */

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CARD_SIZES, CardSize } from '../config/animationConfig';

export interface CardBackProps {
  size?:       CardSize;
  style?:      React.CSSProperties;
  layoutId?:   string;
  animateIn?:  boolean;
  /** Subtle rotation (deg) for deck-stack stagger effect */
  rotate?:     number;
}

// ── Ornate back pattern ───────────────────────────────────────────────────────
// Rendered as an SVG inside the card area. viewBox matches card proportions.

function BackPattern({ w, h }: { w: number; h: number }) {
  const frameInset = 6;
  const innerX     = frameInset + 3;
  const innerY     = frameInset + 3;
  const innerW     = w - (frameInset + 3) * 2;
  const innerH     = h - (frameInset + 3) * 2;
  const cx         = w / 2;
  const cy         = h / 2;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', inset: 0, display: 'block' }}
      aria-hidden="true"
    >
      <defs>
        {/* Sri Lankan Kandyan-inspired repeating background pattern */}
        <pattern id="kandyan-bg" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
          {/* Main intersecting curves */}
          <path d="M8 0 Q16 8 8 16 Q0 8 8 0 Z" fill="none" stroke="#C9A45C" strokeWidth="0.4" opacity="0.3" />
          {/* Inner petal */}
          <path d="M8 3 Q11 8 8 13 Q5 8 8 3 Z" fill="#12352A" opacity="0.6" />
          <circle cx="8" cy="8" r="1.5" fill="#C9A45C" opacity="0.4" />
          {/* Corner accents */}
          <circle cx="0"  cy="0"  r="0.8" fill="#E1C27A" opacity="0.2" />
          <circle cx="16" cy="0"  r="0.8" fill="#E1C27A" opacity="0.2" />
          <circle cx="0"  cy="16" r="0.8" fill="#E1C27A" opacity="0.2" />
          <circle cx="16" cy="16" r="0.8" fill="#E1C27A" opacity="0.2" />
        </pattern>

        {/* Clip to inner card area */}
        <clipPath id={`card-clip-${w}`}>
          <rect x={innerX} y={innerY} width={innerW} height={innerH} rx="4" />
        </clipPath>
      </defs>

      {/* Outer gold frame with corner styling */}
      <rect
        x={frameInset}  y={frameInset}
        width={w - frameInset * 2}  height={h - frameInset * 2}
        rx="8"
        fill="none"
        stroke="#E1C27A"
        strokeWidth="1.2"
        opacity="0.8"
      />
      {/* Inner fine gold line */}
      <rect
        x={innerX}  y={innerY}
        width={innerW}  height={innerH}
        rx="4"
        fill="none"
        stroke="#C9A45C"
        strokeWidth="0.6"
        opacity="0.5"
      />

      {/* Pattern fill */}
      <rect
        x={innerX}  y={innerY}
        width={innerW}  height={innerH}
        rx="4"
        fill="url(#kandyan-bg)"
        clipPath={`url(#card-clip-${w})`}
      />

      {/* Center Lotus ornament */}
      {w >= 48 && (
        <g transform={`translate(${cx}, ${cy})`}>
          {/* Lotus outer petals */}
          <path d="M0 -18 C12 -6 12 6 0 18 C-12 6 -12 -6 0 -18 Z" fill="none" stroke="#E1C27A" strokeWidth="0.8" opacity="0.6" />
          <path d="M-18 0 C-6 12 6 12 18 0 C6 -12 -6 -12 -18 0 Z" fill="none" stroke="#E1C27A" strokeWidth="0.8" opacity="0.6" />
          {/* Lotus inner fill */}
          <path d="M0 -12 C8 -4 8 4 0 12 C-8 4 -8 -4 0 -12 Z" fill="#1B4A38" opacity="0.8" />
          <path d="M-12 0 C-4 8 4 8 12 0 C4 -8 -4 -8 -12 0 Z" fill="#1B4A38" opacity="0.8" />
          {/* Lotus center dot */}
          <circle cx="0" cy="0" r="3" fill="#E1C27A" opacity="0.9" />
          <circle cx="0" cy="0" r="5" fill="none" stroke="#C9A45C" strokeWidth="0.5" />
        </g>
      )}

      {/* Top-left / bottom-right corner ornaments */}
      {w >= 48 && (
        <>
          <path d={`M${frameInset+8} ${frameInset+10} Q${frameInset+12} ${frameInset+12} ${frameInset+10} ${frameInset+8}`}
            fill="none" stroke="#E1C27A" strokeWidth="1" opacity="0.7" />
          <path d={`M${w-frameInset-8} ${h-frameInset-10} Q${w-frameInset-12} ${h-frameInset-12} ${w-frameInset-10} ${h-frameInset-8}`}
            fill="none" stroke="#E1C27A" strokeWidth="1" opacity="0.7" />
        </>
      )}
    </svg>
  );
}

// ── CardBack ──────────────────────────────────────────────────────────────────

export function CardBack({ size = 'sm', style, layoutId, animateIn = false, rotate = 0 }: CardBackProps) {
  const prefersReduced          = useReducedMotion();
  const { width, height }       = CARD_SIZES[size];

  const enterVariants = prefersReduced ? {} : {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1,   opacity: 1 },
  };

  return (
    <motion.div
      layoutId={layoutId}
      {...(animateIn ? enterVariants : {})}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      style={{
        width,
        height,
        borderRadius: 12,
        background:   'linear-gradient(155deg, #10261D 0%, #08130F 100%)',
        border:       '1px solid #A9823D',
        boxShadow:    '0 4px 12px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(225,194,122,0.15)',
        position:     'relative',
        overflow:     'hidden',
        userSelect:   'none',
        flexShrink:   0,
        transform:    `rotate(${rotate}deg)`,
        ...style,
      }}
    >
      {/* Top edge highlight */}
      <div style={{
        position:     'absolute',
        top:          0, left: 0, right: 0,
        height:       1,
        background:   'linear-gradient(90deg, rgba(225,194,122,0.1) 0%, rgba(225,194,122,0.4) 50%, rgba(225,194,122,0.1) 100%)',
        borderRadius: '12px 12px 0 0',
        pointerEvents:'none',
      }} />

      <BackPattern w={width} h={height} />
    </motion.div>
  );
}
