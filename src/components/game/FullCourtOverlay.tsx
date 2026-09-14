'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PublicGameState, Position, Suit } from '@/types/game';
import { useGameStore } from '@/store/gameStore';
import { CardExchangeAnimation } from '@/components/cards/animations/CardExchangeAnimation';

interface FullCourtOverlayProps {
  gameState: PublicGameState | null;
  myPosition: Position | null;
}

export function FullCourtOverlay({ gameState, myPosition }: FullCourtOverlayProps) {
  const [localStep, setLocalStep] = useState<'announcing' | 'requesting' | 'exchanging' | 'deciding' | 'done'>('done');
  const [selectedSuits, setSelectedSuits] = useState<Suit[]>([]);
  const [exchangeVisible, setExchangeVisible] = useState(false);
  const [exchangeDirection, setExchangeDirection] = useState<'forward' | 'reverse'>('forward');

  // Sync with game state
  useEffect(() => {
    if (!gameState) return;
    if (gameState.phase === 'full_court_pending') {
      if (gameState.cardExchangePhase === 'requesting') {
        setLocalStep('announcing');
        setTimeout(() => setLocalStep('requesting'), 2000);
      } else if (gameState.cardExchangePhase === 'requester_deciding') {
        setLocalStep('exchanging');
        setExchangeDirection('forward');
        setExchangeVisible(true);
      } else if (gameState.cardExchangePhase === 'done') {
        setLocalStep('done');
      }
    } else {
      setLocalStep('done');
      setExchangeVisible(false);
    }
  }, [gameState?.phase, gameState?.cardExchangePhase]);

  // When step changes, handle states
  useEffect(() => {
     // Triggered directly for UI state testing when no server available
  }, [localStep]);

  if (localStep === 'done') return null;

  const isRequester = myPosition === gameState?.courtRequesterPosition;
  const partnerPosition = gameState?.courtRequesterPosition != null ? ((gameState.courtRequesterPosition + 2) % 4 as Position) : 2;

  const handleRequestSubmit = () => {
    setLocalStep('exchanging');
    setExchangeDirection('forward');
    setExchangeVisible(true);
  };

  const handleExchangeComplete = () => {
    setExchangeVisible(false);
    if (exchangeDirection === 'forward') {
      setLocalStep('deciding');
    } else {
      setLocalStep('done');
    }
  };

  const handleAccept = () => {
    // API Call goes here
    setLocalStep('done');
  };

  const handleCancel = () => {
    setExchangeDirection('reverse');
    setExchangeVisible(true);
    setLocalStep('exchanging');
  };

  return (
    <>
      <AnimatePresence>
        {localStep !== 'exchanging' && (
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
            {/* Announcing Phase */}
            {localStep === 'announcing' && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 1.1, opacity: 0, transition: { duration: 0.2 } }}
                style={{
                  fontSize: '3rem',
                  fontWeight: 800,
                  color: 'var(--color-gold)',
                  textShadow: '0 4px 16px rgba(0,0,0,0.8)',
                  letterSpacing: '0.05em',
                  fontFamily: 'var(--font-sinhala-serif), serif',
                }}
              >
                ෆුල් කෝට් ඉල්ලීමක්!
              </motion.div>
            )}

            {/* Requesting Phase (Requester UI) */}
            {localStep === 'requesting' && isRequester && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
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
                <h2 style={{ color: 'var(--color-gold)', marginBottom: '1rem', fontSize: '1.2rem', fontFamily: 'var(--font-sinhala-serif)' }}>සහකරුගෙන් කාඩ්පත් 2ක් ඉල්ලන්න</h2>
                <p style={{ color: 'var(--color-text-main)', fontSize: '0.9rem', marginBottom: '1.5rem', opacity: 0.8 }}>
                  ඔබට අවශ්‍ය හොඳම කාඩ්පත්වල තුරුම්පු වර්ග තෝරන්න.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem' }}>
                  {['spades', 'hearts', 'diamonds', 'clubs'].map((suit) => {
                    const count = selectedSuits.filter(s => s === suit).length;
                    return (
                      <button
                        key={suit}
                        onClick={() => {
                          if (selectedSuits.length < 2) {
                            setSelectedSuits([...selectedSuits, suit as Suit]);
                          }
                        }}
                        style={{
                          background: 'rgba(0,0,0,0.5)',
                          border: `1px solid ${count > 0 ? '#c9a84c' : '#333'}`,
                          borderRadius: '8px',
                          padding: '1rem',
                          cursor: selectedSuits.length >= 2 ? 'not-allowed' : 'pointer',
                          position: 'relative'
                        }}
                      >
                        <div style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: (suit === 'hearts' || suit === 'diamonds') ? 'var(--color-danger)' : '#bdc3c7', fontSize: '1.5rem' }}>
                          {suit === 'spades' && '♠'}
                          {suit === 'hearts' && '♥'}
                          {suit === 'diamonds' && '♦'}
                          {suit === 'clubs' && '♣'}
                        </div>
                        {count > 0 && (
                          <div style={{
                            position: 'absolute', top: -8, right: -8, background: 'var(--color-gold)', color: 'var(--color-felt-dark)',
                            borderRadius: '50%', width: 20, height: 20, fontSize: '0.8rem', fontWeight: 'bold'
                          }}>
                            {count}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button
                    onClick={() => setSelectedSuits([])}
                    style={{ background: 'transparent', color: 'var(--color-gold)', border: '1px solid var(--color-gold)', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    මකන්න
                  </button>
                  <button
                    disabled={selectedSuits.length !== 2}
                    onClick={handleRequestSubmit}
                    style={{ background: selectedSuits.length === 2 ? 'var(--color-gold)' : '#555', color: selectedSuits.length === 2 ? 'var(--color-felt-dark)' : '#aaa', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '4px', cursor: selectedSuits.length === 2 ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
                  >
                    ඉල්ලීම යවන්න
                  </button>
                </div>
              </motion.div>
            )}

            {/* Waiting for partner UI */}
            {localStep === 'requesting' && !isRequester && (
              <div style={{ color: 'var(--color-gold)', fontSize: '1.2rem', letterSpacing: '0.05em', fontFamily: 'var(--font-sinhala-sans)' }}>
                ක්‍රීඩකයාගේ ඉල්ලීම තෙක් රැඳී සිටින්න...
              </div>
            )}

            {/* Deciding Phase */}
            {localStep === 'deciding' && isRequester && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
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
                <h2 style={{ color: 'var(--color-gold)', marginBottom: '2rem', fontSize: '1.4rem', fontFamily: 'var(--font-sinhala-serif)' }}>කාඩ්පත් හුවමාරු කර ගත්තා!</h2>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button
                    onClick={handleCancel}
                    style={{ background: 'transparent', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    අවලංගු කර කාඩ්පත් ආපසු දෙන්න
                  </button>
                  <button
                    onClick={handleAccept}
                    style={{ background: 'var(--color-gold)', color: 'var(--color-felt-dark)', border: 'none', padding: '0.75rem 2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    ෆුල් කෝට් ක්‍රීඩා කරන්න
                  </button>
                </div>
              </motion.div>
            )}
            
            {localStep === 'deciding' && !isRequester && (
              <div style={{ color: 'var(--color-gold)', fontSize: '1.2rem', letterSpacing: '0.05em', fontFamily: 'var(--font-sinhala-sans)' }}>
                ක්‍රීඩකයාගේ තීරණය තෙක් රැඳී සිටින්න...
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animation Layer is always active, but visible flag controls it */}
      {gameState?.courtRequesterPosition != null && (
        <CardExchangeAnimation
          visible={exchangeVisible}
          fromPosition={exchangeDirection === 'forward' ? partnerPosition : gameState.courtRequesterPosition}
          toPosition={exchangeDirection === 'forward' ? gameState.courtRequesterPosition : partnerPosition}
          cardCount={2}
          onComplete={handleExchangeComplete}
        />
      )}
    </>
  );
}
