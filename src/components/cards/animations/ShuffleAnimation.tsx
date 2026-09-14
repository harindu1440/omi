'use client';
/**
 * ShuffleAnimation.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Visual-only shuffle overlay. Plays a believable physical shuffle sequence
 * entirely disconnected from the server-computed deck order.
 *
 * Sequence:
 *   1. Gather        — two half-decks slide to center
 *   2. Compress      — deck squishes slightly
 *   3. Split         — cut into two halves with a gap
 *   4. Riffle        — cards interleave in staggered drops
 *   5. Close         — halves merge
 *   6. Cut           — top portion lifts and drops to bottom
 *   7. Settle        — deck taps down
 *   8. onComplete()
 */

import React, { useEffect, useRef } from 'react';
import { motion, useAnimate, useReducedMotion } from 'framer-motion';
import { CARD_ANIM } from '../config/animationConfig';

export interface ShuffleAnimationProps {
  onComplete: () => void;
  visible:    boolean;
}

const CARD_W   = 56;   // px — shuffle display card width
const CARD_H   = 78;   // px — shuffle display card height
const N_CARDS  = 16;   // number of visual cards per half
const HALF     = N_CARDS;

// Single shuffle card — a thin dark-green rectangle with gold border
function ShuffleCard({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{
      width:        CARD_W,
      height:       CARD_H,
      borderRadius: 7,
      background:   'linear-gradient(155deg, #1a3d20, #0d1f0f)',
      border:       '1px solid rgba(201,168,76,0.55)',
      boxShadow:    '0 2px 6px rgba(0,0,0,0.6)',
      position:     'absolute',
      ...style,
    }} />
  );
}

export function ShuffleAnimation({ onComplete, visible }: ShuffleAnimationProps) {
  const prefersReduced = useReducedMotion();
  const [scope, animate] = useAnimate();
  const hasRun = useRef(false);

  useEffect(() => {
    if (!visible || hasRun.current) return;
    hasRun.current = true;

    if (prefersReduced) {
      // Instant: skip animation, just wait briefly and complete
      const timer = setTimeout(onComplete, 300);
      return () => clearTimeout(timer);
    }

    // ── Sequential animation ──────────────────────────────────────
    async function runShuffle() {
      const { gather, compress, expand, split, riffle, close, cut, settle, cardStagger } = CARD_ANIM.shuffle;

      // 1. Gather — two halves slide in from sides
      await animate([
        ['#left-half',  { x: 0 }, { duration: gather, ease: 'easeOut' }],
        ['#right-half', { x: 0 }, { duration: gather, ease: 'easeOut', at: '<' }],
      ]);

      // 2. Compress — deck squashes vertically
      await animate([
        ['#left-half',  { scaleY: 0.92 }, { duration: compress }],
        ['#right-half', { scaleY: 0.92 }, { duration: compress, at: '<' }],
      ]);

      // 3. Expand back
      await animate([
        ['#left-half',  { scaleY: 1 }, { duration: expand }],
        ['#right-half', { scaleY: 1 }, { duration: expand, at: '<' }],
      ]);

      // 4. Split — pull halves apart
      await animate([
        ['#left-half',  { x: -(CARD_W * 0.55) }, { duration: split, ease: 'easeInOut' }],
        ['#right-half', { x:   CARD_W * 0.55  }, { duration: split, ease: 'easeInOut', at: '<' }],
      ]);

      // 5. Riffle — staggered cards drop from each half into center
      //    We animate individual card elements (alternating L/R)
      await animate([
        ['#left-half',  { rotate: -6 }, { duration: riffle * 0.5, ease: 'easeOut' }],
        ['#right-half', { rotate:  6 }, { duration: riffle * 0.5, ease: 'easeOut', at: '<' }],
        ['#left-half',  { rotate:  0 }, { duration: riffle * 0.5 }],
        ['#right-half', { rotate:  0 }, { duration: riffle * 0.5, at: '<' }],
      ]);

      // 6. Close — merge halves back to center
      await animate([
        ['#left-half',  { x: 0 }, { duration: close, ease: 'easeOut' }],
        ['#right-half', { x: 0 }, { duration: close, ease: 'easeOut', at: '<' }],
      ]);

      // 7. Cut — top card strip lifts and drops to bottom
      await animate([
        ['#cut-strip', { y: -CARD_H * 0.4, opacity: 1 }, { duration: cut * 0.5, ease: 'easeOut' }],
        ['#cut-strip', { y:  CARD_H * 0.6 },             { duration: cut * 0.5, ease: 'easeIn'  }],
        ['#cut-strip', { opacity: 0 },                    { duration: 0.1 }],
      ]);

      // 8. Second cut (quick)
      await animate([
        ['#left-half',  { y: -6 }, { duration: settle * 0.5 }],
        ['#right-half', { y: -6 }, { duration: settle * 0.5, at: '<' }],
        ['#left-half',  { y:  0 }, { duration: settle * 0.5, ease: [0.34, 1.56, 0.64, 1] }],
        ['#right-half', { y:  0 }, { duration: settle * 0.5, ease: [0.34, 1.56, 0.64, 1], at: '<' }],
      ]);

      // Done
      onComplete();
    }

    runShuffle();
  }, [visible, prefersReduced, animate, onComplete]);

  if (!visible) return null;

  const halfW = CARD_W * 0.6;  // overlap amount so halves start near each other

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position:       'fixed',
        inset:          0,
        zIndex:         200,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        background:     'rgba(7,14,8,0.82)',
        backdropFilter: 'blur(6px)',
      }}
    >
      {/* Label */}
      <div style={{
        position:      'absolute',
        top:           '38%',
        left:          '50%',
        transform:     'translateX(-50%) translateY(-120px)',
        fontSize:      '0.75rem',
        color:         'rgba(201,168,76,0.6)',
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        fontFamily:    '"Inter", system-ui, sans-serif',
        fontWeight:    600,
      }}>
        Shuffling…
      </div>

      {/* Shuffle stage */}
      <div
        ref={scope}
        style={{ position: 'relative', width: CARD_W * 2 + 16, height: CARD_H + 24 }}
      >
        {/* Left half */}
        <motion.div
          id="left-half"
          initial={{ x: -120 }}
          style={{
            position:   'absolute',
            right:      '50%',
            top:        0,
            transformOrigin: 'center bottom',
          }}
        >
          {Array.from({ length: HALF }).map((_, i) => (
            <ShuffleCard
              key={i}
              style={{
                bottom:    i * 0.9,
                right:     0,
                rotate:    `${(i % 3 - 1) * 0.5}deg`,
                zIndex:    i,
                filter:    `brightness(${0.75 + i * 0.016})`,
              }}
            />
          ))}
        </motion.div>

        {/* Right half */}
        <motion.div
          id="right-half"
          initial={{ x: 120 }}
          style={{
            position:   'absolute',
            left:       '50%',
            top:        0,
            transformOrigin: 'center bottom',
          }}
        >
          {Array.from({ length: HALF }).map((_, i) => (
            <ShuffleCard
              key={i}
              style={{
                bottom:    i * 0.9,
                left:      0,
                rotate:    `${(i % 3 - 1) * 0.4}deg`,
                zIndex:    i,
                filter:    `brightness(${0.75 + i * 0.016})`,
              }}
            />
          ))}
        </motion.div>

        {/* Cut strip (top portion that lifts) */}
        <motion.div
          id="cut-strip"
          initial={{ opacity: 0 }}
          style={{
            position:  'absolute',
            top:       0,
            left:      '50%',
            transform: 'translateX(-50%)',
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <ShuffleCard
              key={i}
              style={{
                bottom:  i * 0.9,
                left:    0,
                zIndex:  N_CARDS + i,
                filter:  'brightness(1.1)',
              }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
