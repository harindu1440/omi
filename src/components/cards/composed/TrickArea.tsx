'use client';
/**
 * TrickArea.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Center-of-table trick display. Shows up to 4 played cards, one per player
 * position, each oriented toward table center.
 *
 * Layout (relative to local player at bottom):
 *   Position 0 (bottom/me)  → bottom slot
 *   Position 1 (right)      → right slot
 *   Position 2 (top)        → top slot
 *   Position 3 (left)       → left slot
 */

import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { CardPlay, Position, Suit } from '@/types/game';
import { Card } from '../primitives/Card';
import { SUIT_UNICODE } from '../primitives/CardSvgSymbols';

export interface TrickAreaProps {
  plays:              CardPlay[];
  myPosition:         Position;
  winnerPosition?:    Position | null;  // set after trick resolves
  trumpSuit?:         Suit | null;
  phase?:             string;
  style?:             React.CSSProperties;
}

// Card rotation per slot to "face" table center
const SLOT_ROTATION: Record<'bottom' | 'right' | 'top' | 'left', number> = {
  bottom:  0,
  right:   90,
  top:     180,
  left:    -90,
};

// Entry direction per slot
const SLOT_ENTRY: Record<'bottom' | 'right' | 'top' | 'left', { y?: number; x?: number }> = {
  bottom: { y:  30 },
  right:  { x:  30 },
  top:    { y: -30 },
  left:   { x: -30 },
};

function getSlotName(position: Position, myPosition: Position): 'bottom' | 'right' | 'top' | 'left' {
  const relative = ((position - myPosition + 4) % 4) as 0 | 1 | 2 | 3;
  return (['bottom', 'right', 'top', 'left'] as const)[relative];
}

export function TrickArea({
  plays,
  myPosition,
  winnerPosition,
  trumpSuit,
  phase,
  style,
}: TrickAreaProps) {
  const prefersReduced = useReducedMotion();

  return (
    <div
      aria-label="Trick area"
      style={{
        position: 'relative',
        width:    160,
        height:   160,
        ...style,
      }}
    >
      {/* Trump badge — top-right */}
      {trumpSuit && (
        <div style={{
          position:   'absolute',
          top:        -32,
          right:      -8,
          padding:    '0.3rem 0.65rem',
          background: 'rgba(0,0,0,0.55)',
          borderRadius: 12,
          border:     '1px solid rgba(201,168,76,0.25)',
          fontSize:   '0.85rem',
          display:    'flex',
          alignItems: 'center',
          gap:        6,
          backdropFilter: 'blur(8px)',
          zIndex:     10,
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-gold)', fontFamily: 'var(--font-sinhala-sans), sans-serif', letterSpacing: '0.05em' }}>
            තුරුම්පු
          </span>
          <span style={{
            color:      ['hearts','diamonds'].includes(trumpSuit) ? 'var(--color-danger)' : 'var(--color-text-main)',
            fontSize:   '1.2rem',
            fontFamily: '"Georgia", serif',
            filter:     'drop-shadow(0 0 4px rgba(201,168,76,0.6))',
          }}>
            {SUIT_UNICODE[trumpSuit]}
          </span>
        </div>
      )}

      <AnimatePresence mode="popLayout">
        {plays.map((play) => {
          const slot      = getSlotName(play.position, myPosition);
          const rotation  = SLOT_ROTATION[slot];
          const entry     = SLOT_ENTRY[slot];
          const isWinner  = winnerPosition === play.position;

          // Position each card in its slot
          const slotStyle: React.CSSProperties = {
            position: 'absolute',
            ...(slot === 'bottom' ? { bottom: 0,  left: '50%', transform: `translateX(-50%) rotate(${rotation}deg)` } : {}),
            ...(slot === 'top'    ? { top:    0,  left: '50%', transform: `translateX(-50%) rotate(${rotation}deg)` } : {}),
            ...(slot === 'left'   ? { left:   0,  top:  '50%', transform: `translateY(-50%) rotate(${rotation}deg)` } : {}),
            ...(slot === 'right'  ? { right:  0,  top:  '50%', transform: `translateY(-50%) rotate(${rotation}deg)` } : {}),
          };

          return (
            <motion.div
              key={`${play.position}-${play.card.id}`}
              style={slotStyle}
              initial={prefersReduced ? { opacity: 0 } : {
                opacity: 0,
                scale:   0.75,
                x:       entry.x ?? 0,
                y:       entry.y ?? 0,
              }}
              animate={{
                opacity: 1,
                scale:   isWinner ? 1.06 : 0.96,
                x:       0,
                y:       0,
              }}
              exit={{
                opacity: 0,
                scale:   0.6,
                transition: { duration: prefersReduced ? 0 : 0.25 },
              }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            >
              <Card
                card={play.card}
                size="md"
                isHighlighted={isWinner}
                style={{
                  boxShadow: isWinner
                    ? '0 8px 28px rgba(0,0,0,0.7), 0 0 0 2px #c9a84c, 0 0 24px rgba(201,168,76,0.5)'
                    : '0 4px 16px rgba(0,0,0,0.55)',
                }}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Empty state */}
      {plays.length === 0 && (
        <div style={{
          position:       'absolute',
          inset:          0,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          color:          'rgba(240,234,216,0.18)',
          fontSize:       '0.8rem',
          letterSpacing:  '0.08em',
          textTransform:  'uppercase',
          fontFamily:     '"Inter", system-ui, sans-serif',
        }}>
          {phase ? phase.replace(/_/g, ' ') : '—'}
        </div>
      )}
    </div>
  );
}
