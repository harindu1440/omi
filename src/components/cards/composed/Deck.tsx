'use client';
/**
 * Deck.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Stacked deck with 3-D depth illusion.
 * Used as the visual dealing source on the game table.
 */

import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { CardBack } from '../primitives/CardBack';
import { CARD_SIZES } from '../config/animationConfig';

export interface DeckProps {
  cardCount?: number;       // total cards remaining (visual only)
  size?:      'xs' | 'sm'; // deck size (xs=compact, sm=normal)
  style?:     React.CSSProperties;
  className?: string;
  label?:     string;       // accessible label
}

const LAYER_COUNT   = 5;    // max visible stack layers
const LAYER_OFFSET  = 1.4;  // px vertical offset per layer
const LAYER_SHIFT   = 0.4;  // px horizontal shift per layer (gives tilt)

// Pre-computed subtle rotations for authenticity — not perfectly aligned
const LAYER_ROTATIONS = [-0.4, 0.6, -0.2, 0.8, -0.5];

export const Deck = forwardRef<HTMLDivElement, DeckProps>(function Deck(
  { cardCount = 32, size = 'sm', style, className, label = 'Card deck' },
  ref,
) {
  const backSize                  = size === 'xs' ? 'xs' : 'sm';
  const { width, height }         = CARD_SIZES[backSize];
  const layers                    = Math.max(1, Math.min(LAYER_COUNT, Math.ceil(cardCount / 6)));

  return (
    <motion.div
      ref={ref}
      aria-label={label}
      className={className}
      style={{
        position:   'relative',
        width,
        height:     height + layers * LAYER_OFFSET,
        flexShrink: 0,
        ...style,
      }}
    >
      {/* Stack layers (bottom → top) */}
      {Array.from({ length: layers }).map((_, i) => {
        const fromTop   = layers - 1 - i;  // 0 = topmost card
        const offsetY   = fromTop * LAYER_OFFSET;
        const offsetX   = fromTop * LAYER_SHIFT;
        const rotate    = LAYER_ROTATIONS[i % LAYER_ROTATIONS.length];
        const isTop     = fromTop === 0;

        return (
          <div
            key={i}
            style={{
              position:  'absolute',
              bottom:    offsetY,
              left:      offsetX,
              zIndex:    i,
              // Slight shadow between stack layers for depth
              filter:    !isTop ? 'brightness(0.88)' : undefined,
            }}
          >
            <CardBack size={backSize} rotate={rotate} />
          </div>
        );
      })}

      {/* Card count badge */}
      {cardCount > 0 && (
        <div style={{
          position:   'absolute',
          bottom:     -16,
          left:       '50%',
          transform:  'translateX(-50%)',
          fontSize:   10,
          color:      'rgba(201,168,76,0.55)',
          fontFamily: '"Inter", system-ui, sans-serif',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          letterSpacing: '0.05em',
        }}>
          {cardCount} cards
        </div>
      )}
    </motion.div>
  );
});
