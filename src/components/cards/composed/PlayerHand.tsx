'use client';
/**
 * PlayerHand.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Renders the local player's fanned face-up hand with:
 *   • Natural fan layout (angle + arc lift)
 *   • Desktop hover lift (CSS, no JS)
 *   • Touch/click selection → tap selected to play
 *   • Played card exits smoothly via AnimatePresence
 *   • Hand reorganizes after each play
 *   • prefers-reduced-motion support
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Card as CardType } from '@/types/game';
import { Card } from '../primitives/Card';
import { CARD_SIZES, CARD_ANIM } from '../config/animationConfig';

export interface PlayerHandProps {
  cards:        CardType[];
  legalPlays:   string[];    // card ids currently legal to play
  isMyTurn:     boolean;
  onPlay:       (cardId: string) => void;
  style?:       React.CSSProperties;
}

// ── Fan geometry helpers ──────────────────────────────────────────────────────

function getFanParams(n: number) {
  const { overlap, maxAngle, arcLift } = CARD_ANIM.fan;
  const center = (n - 1) / 2;

  return Array.from({ length: n }, (_, i) => {
    const dist        = i - center;                           // distance from center
    const halfN       = Math.max(1, center);
    const rotation    = (dist / halfN) * maxAngle;           // ±maxAngle at edges
    const yOffset     = -arcLift * (1 - Math.abs(dist) / Math.max(1, halfN)); // center cards lift
    const xOffset     = i * (CARD_SIZES.lg.width - overlap); // horizontal spread

    return { rotation, yOffset, xOffset };
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PlayerHand({ cards, legalPlays, isMyTurn, onPlay, style }: PlayerHandProps) {
  const prefersReduced              = useReducedMotion();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fanParams = getFanParams(cards.length);
  const totalW    = cards.length === 0 ? 0 :
    fanParams[fanParams.length - 1].xOffset + CARD_SIZES.lg.width;

  // Touch-friendly interaction:
  //   First tap  → select card
  //   Second tap → play card (if legal)
  const handleCardClick = useCallback((card: CardType, isLegal: boolean) => {
    if (!isMyTurn || !isLegal) return;

    if (selectedId === card.id) {
      // Second tap: play (now we'll use a dedicated Play button instead for touch targets, but keep tap as fallback)
      onPlay(card.id);
      setSelectedId(null);
    } else {
      // First tap: select
      setSelectedId(card.id);
    }
  }, [selectedId, isMyTurn, onPlay]);

  // Clear selection when hand changes (card was played from another path)
  React.useEffect(() => {
    if (selectedId && !cards.find(c => c.id === selectedId)) {
      setSelectedId(null);
    }
  }, [cards, selectedId]);

  if (cards.length === 0) return null;

  return (
    <div
      role="group"
      aria-label="Your hand"
      style={{
        position:   'relative',
        width:      '100%', // Take full width of parent
        maxWidth:   totalW, // But max out at fan width
        height:     CARD_SIZES.lg.height + CARD_ANIM.fan.arcLift + Math.abs(CARD_ANIM.selected.lift) + 8,
        flexShrink: 0,
        overflowX:  'auto',
        overflowY:  'visible',
        display:    'flex',
        justifyContent: 'center', // Center on desktop
        WebkitOverflowScrolling: 'touch', // Smooth scroll on iOS
        ...style,
      }}
    >
      {/* Inner container to hold absolute cards and maintain width for scrolling */}
      <div style={{ position: 'relative', width: totalW, minWidth: totalW, height: '100%' }}>
      <AnimatePresence mode="popLayout">
        {cards.map((card, i) => {
          const { rotation, yOffset, xOffset } = fanParams[i];
          const isSelected = selectedId === card.id;
          const isLegal    = legalPlays.includes(card.id);

          // Lift amount: selected > hover (hover handled by CSS in globals)
          const liftY = isSelected
            ? CARD_ANIM.selected.lift + yOffset
            : yOffset;

          return (
            <motion.div
              key={card.id}
              layout
              initial={prefersReduced ? { opacity: 0 } : {
                opacity: 0,
                y:       -40,
                scale:   0.8,
              }}
              animate={{
                opacity: 1,
                y:       liftY,
                x:       xOffset,
                rotate:  rotation,
                scale:   isSelected ? CARD_ANIM.selected.scale : 1,
              }}
              exit={prefersReduced ? { opacity: 0 } : {
                opacity: 0,
                y:       -60,
                scale:   0.7,
                transition: { duration: 0.28, ease: [0.4, 0, 1, 1] },
              }}
              transition={{
                layout:  { type: 'spring', stiffness: 280, damping: 24 },
                default: { type: 'spring', stiffness: 300, damping: 26 },
              }}
              whileHover={!prefersReduced && isLegal && isMyTurn && !isSelected ? {
                y:     liftY + CARD_ANIM.hover.lift,
                scale: CARD_ANIM.hover.scale,
                zIndex: 50,
                transition: { duration: CARD_ANIM.hover.duration },
              } : {}}
              style={{
                position:  'absolute',
                left:      0,
                bottom:    0,
                zIndex:    isSelected ? 60 : i,
                cursor:    isLegal && isMyTurn ? 'pointer' : 'default',
                touchAction: 'manipulation',
              }}
              onClick={() => handleCardClick(card, isLegal)}
            >
              <Card
                card={card}
                size="lg"
                isLegal={isMyTurn ? isLegal : true}  // outside my turn: all look normal
                isSelected={isSelected}
                aria-label={`${card.rank} of ${card.suit}${isSelected ? ' — tap to play' : ''}`}
              />
              <AnimatePresence>
                {isSelected && isLegal && isMyTurn && (
                  <motion.button
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: -20, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: 'spring', damping: 20 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlay(card.id);
                      setSelectedId(null);
                    }}
                    className="btn-primary"
                    style={{
                      position: 'absolute',
                      top: -45,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      padding: '0.4rem 1.2rem',
                      fontSize: '0.9rem',
                      zIndex: 70,
                      boxShadow: '0 8px 16px rgba(0,0,0,0.5), 0 0 16px rgba(201,168,76,0.5)',
                    }}
                  >
                    Play
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>
      </div> {/* End inner container */}

      {/* Turn indicator */}
      {isMyTurn && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          style={{
            position:       'absolute',
            bottom:         -22,
            left:           '50%',
            transform:      'translateX(-50%)',
            fontSize:       '0.8rem',
            color:          'var(--color-gold)',
            letterSpacing:  '0.05em',
            fontFamily:     'var(--font-sinhala-sans), sans-serif',
            fontWeight:     600,
            whiteSpace:     'nowrap',
          }}
        >
          {selectedId ? 'Play' : 'ඔබේ වාරය'}
        </motion.div>
      )}
    </div>
  );
}
