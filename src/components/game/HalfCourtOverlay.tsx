'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PublicGameState, Position, Suit } from '@/types/game';

interface HalfCourtOverlayProps {
  gameState: PublicGameState | null;
  myPosition: Position | null;
}

export function HalfCourtOverlay({ gameState, myPosition }: HalfCourtOverlayProps) {
  const [localStep, setLocalStep] = useState<'idle' | 'confirming' | 'trump_selection' | 'announcing' | 'done'>('idle');
  
  // Is this player eligible to request Half Court?
  // Server-side validates this too, but we drive the UI here.
  const phase = gameState?.phase;
  const callerTeam = gameState?.trumpCallerPosition != null ? gameState.trumpCallerPosition % 2 : null;
  const myTeam = myPosition != null ? myPosition % 2 : null;
  const isEligiblePhase = phase === 'trump_selection' || phase === 'dealing_rest' || phase === 'court_window';
  const isEligiblePlayer = myTeam != null && callerTeam != null && myTeam !== callerTeam;
  
  const showButton = isEligiblePhase && isEligiblePlayer && localStep === 'idle';

  // Sync state transitions if someone else requested it or we progressed
  useEffect(() => {
    if (!gameState) return;
    if (gameState.phase === 'half_court_pending') {
      if (myPosition === gameState.courtRequesterPosition && localStep !== 'trump_selection') {
         setLocalStep('trump_selection');
      } else if (myPosition !== gameState.courtRequesterPosition) {
         setLocalStep('done'); // The other players just see the table rearrange
      }
    } else if (gameState.phase === 'half_court_playing') {
       if (localStep !== 'announcing' && localStep !== 'done') {
         setLocalStep('announcing');
         setTimeout(() => setLocalStep('done'), 2500);
       }
    } else {
       if (localStep === 'announcing' || localStep === 'done') return;
       setLocalStep('idle');
    }
  }, [gameState?.phase, gameState?.courtRequesterPosition, myPosition, localStep]);

  const handleRequestClick = () => {
    setLocalStep('confirming');
  };

  const handleConfirm = () => {
    // In a real app, API call goes here: /api/game/request-half-court
    // For now, we simulate moving to trump selection
    setLocalStep('trump_selection');
  };

  const handleCancel = () => {
    setLocalStep('idle');
  };

  const handleTrumpSelect = (suit: Suit) => {
    // API Call goes here: /api/game/set-half-court-trump
    // We simulate the broadcast of half_court_playing
    setLocalStep('announcing');
    setTimeout(() => setLocalStep('done'), 2500);
  };

  if (localStep === 'idle' && !showButton) return null;
  if (localStep === 'done') return null;

  return (
    <>
      <AnimatePresence>
        {showButton && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
              position: 'fixed',
              bottom: '160px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 90,
            }}
          >
              <button
              onClick={handleRequestClick}
              style={{
                background: 'linear-gradient(135deg, var(--color-felt-dark), var(--color-table))',
                border: '1px solid var(--color-gold)',
                color: 'var(--color-gold)',
                padding: '0.6rem 1.2rem',
                borderRadius: '24px',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                letterSpacing: '0.05em',
                fontFamily: 'var(--font-sinhala-sans), sans-serif',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5), inset 0 0 10px rgba(201,168,76,0.1)',
                cursor: 'pointer',
              }}
            >
              අර්ධ කෝට් (Half Court)
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(localStep === 'confirming' || localStep === 'trump_selection') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.7)',
              zIndex: 100,
              backdropFilter: 'blur(4px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {localStep === 'confirming' && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0 }}
                style={{
                  background: 'linear-gradient(145deg, var(--color-felt-dark), var(--color-table))',
                  border: '1px solid var(--color-gold)',
                  padding: '2rem',
                  borderRadius: '16px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                  textAlign: 'center',
                  maxWidth: '400px',
                  fontFamily: 'var(--font-sinhala-sans), sans-serif',
                }}
              >
                <h2 style={{ color: 'var(--color-gold)', marginBottom: '1rem', fontSize: '1.4rem', fontFamily: 'var(--font-sinhala-serif)' }}>අර්ධ කෝට් ඉල්ලුම් කරනවාද?</h2>
                <p style={{ color: 'var(--color-text-main)', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.5, opacity: 0.8 }}>
                  ඔබේ සහකරුට මෙම වටය ක්‍රීඩා කළ නොහැක. ඔබ නව තුරුම්පුවක් තෝරාගෙන තුරුම්පු 4 ම ජයගත යුතුය.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button
                    onClick={handleCancel}
                    style={{ background: 'transparent', color: 'var(--color-gold)', border: '1px solid var(--color-gold)', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    අවලංගු කරන්න
                  </button>
                  <button
                    onClick={handleConfirm}
                    style={{ background: 'var(--color-gold)', color: 'var(--color-felt-dark)', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    තහවුරු කරන්න
                  </button>
                </div>
              </motion.div>
            )}

            {localStep === 'trump_selection' && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0 }}
                style={{
                  background: 'linear-gradient(145deg, var(--color-felt-dark), var(--color-table))',
                  border: '1px solid var(--color-gold)',
                  padding: '2rem',
                  borderRadius: '16px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                  textAlign: 'center',
                  fontFamily: 'var(--font-sinhala-sans), sans-serif',
                }}
              >
                <h2 style={{ color: 'var(--color-gold)', marginBottom: '1rem', fontSize: '1.4rem', fontFamily: 'var(--font-sinhala-serif)' }}>නව තුරුම්පුව තෝරන්න</h2>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  {['spades', 'hearts', 'diamonds', 'clubs'].map((suit) => (
                    <button
                      key={suit}
                      onClick={() => handleTrumpSelect(suit as Suit)}
                      style={{
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid var(--color-gold)',
                        borderRadius: '8px',
                        padding: '1rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: (suit === 'hearts' || suit === 'diamonds') ? 'var(--color-danger)' : '#bdc3c7', fontSize: '2rem' }}>
                        {suit === 'spades' && '♠'}
                        {suit === 'hearts' && '♥'}
                        {suit === 'diamonds' && '♦'}
                        {suit === 'clubs' && '♣'}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {localStep === 'announcing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.3)',
              zIndex: 110,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none'
            }}
          >
              <motion.div
              initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 1.2, opacity: 0, transition: { duration: 0.3 } }}
              transition={{ type: 'spring', damping: 15 }}
              style={{
                fontSize: '4rem',
                fontWeight: 900,
                color: 'var(--color-gold)',
                textShadow: '0 8px 32px rgba(0,0,0,0.9), 0 0 20px rgba(201,168,76,0.6)',
                fontFamily: 'var(--font-sinhala-serif), serif',
                textAlign: 'center'
              }}
            >
              අර්ධ කෝට්!
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
