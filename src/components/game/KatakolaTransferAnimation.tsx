'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KatakolaTransaction, Team } from '@/types/game';

interface KatakolaTransferAnimationProps {
  transaction: KatakolaTransaction | null;
  myTeam: Team | null;
}

export function KatakolaTransferAnimation({ transaction, myTeam }: KatakolaTransferAnimationProps) {
  const [activeAnim, setActiveAnim] = useState<KatakolaTransaction | null>(null);

  useEffect(() => {
    if (transaction) {
      setActiveAnim(transaction);
      // Play subtle sound hook mock (using a short timeout)
      const timeout = setTimeout(() => {
        setActiveAnim(null);
      }, 1500); // 1.5s animation duration
      
      return () => clearTimeout(timeout);
    }
  }, [transaction]);

  if (!activeAnim) return null;

  // Determine positions based on `myTeam`
  // Team 0 is Bottom-Left, Team 1 is Top-Right
  const team0IsOurs = myTeam === null ? true : myTeam === 0;
  
  const team0Pos = { left: '4vw', bottom: '10vh' };
  const team1Pos = { right: '4vw', top: '10vh' };

  const fromPos = activeAnim.fromTeam === 0 ? team0Pos : team1Pos;
  const toPos = activeAnim.fromTeam === 0 ? team1Pos : team0Pos;

  // Generate an array of tokens to animate
  const tokens = Array.from({ length: activeAnim.amount }).map((_, i) => `anim-token-${i}`);

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100 }}>
      <AnimatePresence>
        {tokens.map((id, index) => (
          <motion.div
            key={id}
            initial={{ 
              opacity: 0, 
              scale: 0.5,
              ...fromPos
            }}
            animate={{ 
              opacity: [0, 1, 1, 0],
              scale: [0.5, 1.2, 1, 0.5],
              ...toPos 
            }}
            transition={{
              duration: 1.2,
              delay: index * 0.15, // Staggered transfer
              ease: [0.34, 1.56, 0.64, 1], // Custom bounce curve
              opacity: { duration: 1.2, times: [0, 0.2, 0.8, 1] }
            }}
            style={{
              position: 'absolute',
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: activeAnim.fromTeam === 0 
                ? 'radial-gradient(circle at 30% 30%, #ffd700, #b8860b)' 
                : 'radial-gradient(circle at 30% 30%, #e0e0e0, #7f8c8d)',
              border: '2px solid rgba(255,255,255,0.4)',
              boxShadow: '0 8px 16px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              border: '1px solid rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.6
            }}>
              <span style={{ fontSize: '10px', color: '#000', fontWeight: 'bold' }}>K</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
