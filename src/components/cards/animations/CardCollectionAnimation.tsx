'use client';
/**
 * CardCollectionAnimation.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * After a trick resolves, the winning card briefly highlights,
 * then all 4 cards slide toward the winner and fly to their score pile.
 *
 * Triggered externally via the `visible` prop.
 * Clean, subtle — no casino flash.
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Position } from '@/types/game';
import { CARD_ANIM } from '../config/animationConfig';

export interface CardCollectionAnimationProps {
  visible:         boolean;
  winnerPosition:  Position;
  myPosition:      Position;
  onComplete:      () => void;
}

// Destination offset directions per player slot (relative)
const WIN_DIRECTION: Record<'bottom' | 'right' | 'top' | 'left', { x: number; y: number }> = {
  bottom: { x:  0,   y:  80 },
  right:  { x:  80,  y:  0  },
  top:    { x:  0,   y: -80 },
  left:   { x: -80,  y:  0  },
};

type SlotName = 'bottom' | 'right' | 'top' | 'left';

function getSlotName(position: Position, myPosition: Position): SlotName {
  const relative = ((position - myPosition + 4) % 4) as 0 | 1 | 2 | 3;
  return (['bottom', 'right', 'top', 'left'] as const)[relative];
}

type Phase = 'highlight' | 'slide' | 'fly' | 'done';

export function CardCollectionAnimation({
  visible,
  winnerPosition,
  myPosition,
  onComplete,
}: CardCollectionAnimationProps) {
  const prefersReduced      = useReducedMotion();
  const [phase, setPhase]   = useState<Phase>('highlight');

  useEffect(() => {
    if (!visible) { setPhase('highlight'); return; }
    if (prefersReduced) { setTimeout(onComplete, 100); return; }

    const { highlightDuration, slideDelay, slideDuration, flyDuration } = CARD_ANIM.collect;

    // Phase pipeline
    const t1 = setTimeout(() => setPhase('slide'), (highlightDuration + slideDelay) * 1000);
    const t2 = setTimeout(() => setPhase('fly'),   (highlightDuration + slideDelay + slideDuration) * 1000);
    const t3 = setTimeout(() => { setPhase('done'); onComplete(); },
      (highlightDuration + slideDelay + slideDuration + flyDuration) * 1000 + 100);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  const winnerSlot  = getSlotName(winnerPosition, myPosition);
  const flyDir      = WIN_DIRECTION[winnerSlot];

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          key="collection-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          aria-live="polite"
          aria-label={`Trick won by player ${winnerPosition}`}
          style={{
            position:       'fixed',
            inset:          0,
            pointerEvents:  'none',
            zIndex:         120,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
          }}
        >
          {/* Winner indicator text */}
          {phase === 'highlight' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 10 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 22 }}
              style={{
                padding:       '0.5rem 1.2rem',
                background:    'rgba(0,0,0,0.65)',
                borderRadius:  16,
                border:        '1px solid rgba(201,168,76,0.35)',
                fontSize:      '0.8rem',
                color:         'rgba(201,168,76,0.85)',
                fontFamily:    '"Inter", system-ui, sans-serif',
                fontWeight:    600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                backdropFilter:'blur(8px)',
              }}
            >
              Trick won
            </motion.div>
          )}

          {/* Collect arrow — subtle directional indication */}
          {phase === 'slide' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: [0, 0.7, 0], scale: 1 }}
              transition={{ duration: CARD_ANIM.collect.slideDuration }}
              style={{
                width:          40,
                height:         40,
                borderRadius:   '50%',
                background:     'rgba(201,168,76,0.15)',
                border:         '1px solid rgba(201,168,76,0.3)',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                fontSize:       '1.1rem',
                color:          'rgba(201,168,76,0.7)',
              }}
            >
              ✓
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
