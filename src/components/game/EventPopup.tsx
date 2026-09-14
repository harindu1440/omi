'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RoundResult } from '@/types/game';

interface EventPopupProps {
  roundResult: RoundResult | null;
}

export function EventPopup({ roundResult }: EventPopupProps) {
  const [eventData, setEventData] = useState<{ title: string; subtitle: string; color: string } | null>(null);

  useEffect(() => {
    if (!roundResult) {
      setEventData(null);
      return;
    }

    if (roundResult.outcome === 'saporu') {
      setEventData({
        title: 'සපෝරු',
        subtitle: '4-4 TIE',
        color: 'var(--color-gold)'
      });
    } else if (roundResult.outcome === 'kapothi_success') {
      setEventData({
        title: 'කපෝති',
        subtitle: '8-0 SWEEP',
        color: 'var(--color-danger)'
      });
    } else if (roundResult.outcome === 'kapothi_failed') {
      setEventData({
        title: 'කපෝති අසමත් විය',
        subtitle: 'KAPOTHI FAILED',
        color: 'var(--color-text-muted)'
      });
    } else {
      setEventData(null);
    }
  }, [roundResult]);

  return (
    <AnimatePresence>
      {eventData && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, rotate: -5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 1.2, filter: 'blur(10px)' }}
          transition={{ type: 'spring', damping: 12, stiffness: 100 }}
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 150, // Above table, below full overlays
          }}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem 4rem',
            background: 'radial-gradient(circle, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 80%)',
          }}>
            <motion.h1
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              style={{
                fontSize: '5rem',
                fontFamily: 'var(--font-sinhala-serif), serif',
                fontWeight: 900,
                color: eventData.color,
                textShadow: `0 0 40px ${eventData.color}, 0 4px 10px rgba(0,0,0,0.8)`,
                letterSpacing: '0.05em',
                margin: 0,
                lineHeight: 1,
              }}
            >
              {eventData.title}
            </motion.h1>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              style={{
                fontSize: '1.2rem',
                color: 'var(--color-text-main)',
                letterSpacing: '0.2em',
                fontFamily: '"Inter", sans-serif',
                fontWeight: 700,
                marginTop: '1rem',
                textTransform: 'uppercase',
                opacity: 0.8,
              }}
            >
              {eventData.subtitle}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
