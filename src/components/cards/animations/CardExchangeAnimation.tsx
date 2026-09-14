'use client';
/**
 * CardExchangeAnimation.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Full-court card exchange animation — shows cards arcing between
 * the requester and their partner (and back).
 * Face-down during travel unless it's the local player's cards.
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Position } from '@/types/game';
import { CARD_SIZES, CARD_ANIM } from '../config/animationConfig';

export interface CardExchangeAnimationProps {
  visible:           boolean;
  fromPosition:      Position;
  toPosition:        Position;
  cardCount?:        number;   // default 2
  onComplete:        () => void;
}

interface FlyCard {
  id:    string;
  delay: number;
  rotation: number;
  targetRotation: number;
  controlY: string;
}

export function CardExchangeAnimation({
  visible,
  fromPosition,
  toPosition,
  cardCount = 2,
  onComplete,
}: CardExchangeAnimationProps) {
  const prefersReduced                  = useReducedMotion();
  const [cards, setCards]               = useState<FlyCard[]>([]);
  const [done, setDone]                 = useState(false);

  useEffect(() => {
    if (!visible) { setCards([]); setDone(false); return; }
    if (prefersReduced) { setTimeout(onComplete, 100); return; }

    // Is it a vertical exchange? (e.g. from 0 to 2 or 2 to 0)
    const isVertical = (fromPosition === 0 && toPosition === 2) || (fromPosition === 2 && toPosition === 0);

    const newCards: FlyCard[] = Array.from({ length: cardCount }, (_, i) => {
      // Natural randomness
      const startRot = (Math.random() - 0.5) * 20;
      const endRot = (Math.random() - 0.5) * 15;
      
      // Arc property - control point offset based on direction
      // If passing vertically, we want it to bulge left/right
      // If passing horizontally, we want it to arc up
      const arcHeight = 15; // 15% offset
      const controlY = isVertical ? '50%' : '30%';

      return {
        id:    `exc-${i}-${Date.now()}`,
        delay: i * (CARD_ANIM.exchange.stagger + 0.1),
        rotation: startRot,
        targetRotation: endRot,
        controlY
      };
    });
    setCards(newCards);
    setDone(false);

    const totalDur = CARD_ANIM.exchange.duration + (cardCount - 1) * (CARD_ANIM.exchange.stagger + 0.1) + 0.2;
    const timer = setTimeout(() => {
      setDone(true);
      onComplete();
    }, totalDur * 1000);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Position mappings for the exchange arc (rough viewport percentages)
  const POSITION_COORDS: Record<Position, { x: string; y: string }> = {
    0: { x: '50%',  y: '85%' }, // bottom (me)
    1: { x: '88%',  y: '50%' }, // right
    2: { x: '50%',  y: '15%' }, // top
    3: { x: '12%',  y: '50%' }, // left
  };

  const from   = POSITION_COORDS[fromPosition];
  const to     = POSITION_COORDS[toPosition];
  const { width: cW, height: cH } = CARD_SIZES.sm;

  if (!visible || done) return null;

  return (
    <div
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 140 }}
    >
      {/* Exchange label */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: '-50%', x: '-50%' }}
          animate={{ opacity: 1, scale: 1, y: '-50%', x: '-50%' }}
          exit={{ opacity: 0, scale: 0.9 }}
          style={{
            position:       'absolute',
            top:            '50%',
            left:           '50%',
            padding:        '0.5rem 1.2rem',
            background:     'rgba(0,0,0,0.7)',
            borderRadius:   12,
            border:         '1px solid rgba(201,168,76,0.3)',
            fontSize:       '0.8rem',
            fontWeight:     600,
            color:          '#c9a84c',
            letterSpacing:  '0.1em',
            textTransform:  'uppercase',
            backdropFilter: 'blur(8px)',
            fontFamily:     '"Inter", system-ui, sans-serif',
            boxShadow:      '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          Sending Cards...
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {cards.map((fc) => (
          <motion.div
            key={fc.id}
            initial={{ left: from.x, top: from.y, x: '-50%', y: '-50%', opacity: 0, scale: 0.7, rotate: fc.rotation }}
            animate={{
              left:    [from.x, '50%', to.x],
              top:     [from.y, fc.controlY, to.y],
              opacity: [0, 1, 1, 1, 0],
              scale:   [0.7, 1.2, 1.2, 1, 0.8],
              rotate:  [fc.rotation, (fc.rotation + fc.targetRotation) / 2 + 10, fc.targetRotation],
            }}
            transition={{
              duration: CARD_ANIM.exchange.duration + 0.2, // slightly slower for dramatic effect
              delay:    fc.delay,
              ease:     [0.34, 1.56, 0.64, 1], // bouncy springy ease
              times:    [0, 0.4, 0.5, 0.8, 1],
            }}
            exit={{ opacity: 0, scale: 0.7, transition: { duration: 0.15 } }}
            style={{ position: 'fixed' }}
          >
            {/* Face-down exchange card with detailed texture */}
            <div style={{
              width:        cW * 1.5, // slightly larger during exchange
              height:       cH * 1.5,
              borderRadius: 8,
              background:   'linear-gradient(135deg, #1c4224, #0d1f0f)',
              border:       '2px solid rgba(201,168,76,0.7)',
              boxShadow:    '0 12px 30px rgba(0,0,0,0.8), inset 0 0 10px rgba(0,0,0,0.5)',
              position:     'relative',
              overflow:     'hidden',
            }}>
              {/* Card Back Pattern Mockup */}
              <div style={{
                position: 'absolute',
                inset: 4,
                border: '1px dashed rgba(201,168,76,0.4)',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(201,168,76,0.2)',
                fontSize: '1.5rem',
              }}>
                ✦
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
