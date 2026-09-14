'use client';
/**
 * CardDealAnimation.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Animates cards flying from the deck to each player's seat.
 * Cards arc through the air and land with a subtle spring bounce.
 *
 * Usage:
 *   <CardDealAnimation
 *     deals={[{ toPosition: 0, delay: 0 }, { toPosition: 1, delay: 0.09 }, ...]}
 *     deckRef={deckRef}
 *     seatRefs={{ 0: ref0, 1: ref1, 2: ref2, 3: ref3 }}
 *     onComplete={() => {}}
 *   />
 *
 * The component measures DOM positions via getBoundingClientRect, then
 * renders absolutely-positioned animating cards over the game table.
 */

import React, { useEffect, useState, useRef, RefObject } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { Position } from '@/types/game';
import { CARD_SIZES, CARD_ANIM } from '../config/animationConfig';

export interface DealInstruction {
  toPosition: Position;
  delay:      number;    // seconds
  faceUp?:    boolean;   // show face-up on arrival (for local player)
}

export interface CardDealAnimationProps {
  deals:       DealInstruction[];
  deckRef:     RefObject<HTMLElement | null>;
  seatRefs:    Record<Position, RefObject<HTMLElement | null>>;
  visible:     boolean;
  onComplete:  () => void;
}

interface FlyingCard {
  id:         string;
  fromX:      number;
  fromY:      number;
  toX:        number;
  toY:        number;
  rotate:     number;    // landing rotation
  delay:      number;
}

// ── Arc keyframe generator ────────────────────────────────────────────────────
// Returns motion.div keyframe arrays for a parabolic arc via translateX/Y.
// We use three keyframes: start → apex (midpoint + arc height) → end.
function buildArcKeyframes(from: { x: number; y: number }, to: { x: number; y: number }, arcH: number) {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2 - arcH;

  return {
    x:   [from.x, midX, to.x],
    y:   [from.y, midY, to.y],
    rotate: [
      Math.random() * 8 - 4,      // random slight tilt when leaving deck
      Math.random() * 4 - 2,      // small mid-flight tilt
      (Math.random() - 0.5) * 6,  // landing angle
    ],
    scale: [0.95, 1.02, 0.97],
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CardDealAnimation({ deals, deckRef, seatRefs, visible, onComplete }: CardDealAnimationProps) {
  const prefersReduced             = useReducedMotion();
  const [flyCards, setFlyCards]    = useState<FlyingCard[]>([]);
  const completedRef               = useRef(0);
  const resolvedRef                = useRef(false);

  useEffect(() => {
    if (!visible || deals.length === 0) return;
    resolvedRef.current  = false;
    completedRef.current = 0;

    if (prefersReduced) {
      onComplete();
      return;
    }

    // Measure positions after browser paint
    const frame = requestAnimationFrame(() => {
      const deckEl = deckRef.current;
      if (!deckEl) { onComplete(); return; }
      const deckRect = deckEl.getBoundingClientRect();
      const fromX = deckRect.left + deckRect.width  / 2 - CARD_SIZES.sm.width  / 2;
      const fromY = deckRect.top  + deckRect.height / 2 - CARD_SIZES.sm.height / 2;

      const cards: FlyingCard[] = deals.map((deal, i) => {
        const seatEl = seatRefs[deal.toPosition]?.current;
        let toX = fromX, toY = fromY;
        if (seatEl) {
          const r = seatEl.getBoundingClientRect();
          toX = r.left + r.width  / 2 - CARD_SIZES.sm.width  / 2;
          toY = r.top  + r.height / 2 - CARD_SIZES.sm.height / 2;
        }
        return {
          id:     `deal-${i}-${Date.now()}`,
          fromX,  fromY,
          toX,    toY,
          rotate: (Math.random() - 0.5) * 6,
          delay:  deal.delay,
        };
      });

      setFlyCards(cards);
    });

    return () => cancelAnimationFrame(frame);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, deals.length]);

  const handleCardComplete = () => {
    completedRef.current += 1;
    if (completedRef.current >= flyCards.length && !resolvedRef.current) {
      resolvedRef.current = true;
      setTimeout(onComplete, 120); // brief pause after last card lands
    }
  };

  if (!visible || flyCards.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 150 }}
    >
      <AnimatePresence>
        {flyCards.map((fc) => {
          const midX  = (fc.fromX + fc.toX) / 2;
          const midY  = (fc.fromY + fc.toY) / 2 - CARD_ANIM.deal.arcHeight;

          return (
            <motion.div
              key={fc.id}
              initial={{ x: fc.fromX, y: fc.fromY, opacity: 1, scale: 0.95, rotate: (Math.random() - 0.5) * 8 }}
              animate={{
                x:      [fc.fromX, midX,    fc.toX],
                y:      [fc.fromY, midY,    fc.toY],
                rotate: [(Math.random()-0.5)*8, (Math.random()-0.5)*4, (Math.random()-0.5)*5],
                scale:  [0.95, 1.02, 0.97],
                opacity: 1,
              }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }}
              transition={{
                duration: CARD_ANIM.deal.duration,
                delay:    fc.delay,
                ease:     CARD_ANIM.deal.ease,
                times:    [0, 0.45, 1],
              }}
              onAnimationComplete={handleCardComplete}
              style={{ position: 'fixed', top: 0, left: 0, width: CARD_SIZES.sm.width }}
            >
              {/* Face-down flying card */}
              <div style={{
                width:        CARD_SIZES.sm.width,
                height:       CARD_SIZES.sm.height,
                borderRadius: 8,
                background:   'linear-gradient(155deg, #1a3d20, #0d1f0f)',
                border:       '1px solid rgba(201,168,76,0.6)',
                boxShadow:    '0 6px 20px rgba(0,0,0,0.65)',
              }} />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
