'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PublicGameState, Team } from '@/types/game';

interface MatchEndOverlayProps {
  gameState: PublicGameState | null;
  myTeam: Team | null;
}

export function MatchEndOverlay({ gameState, myTeam }: MatchEndOverlayProps) {
  if (!gameState || gameState.phase !== 'match_end' || gameState.matchWinner === null) return null;

  const isWinner = myTeam === gameState.matchWinner;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          zIndex: 200,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(8px)',
        }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 15 }}
          style={{
            background: 'linear-gradient(145deg, #1f2b23, #111a14)',
            border: `2px solid ${isWinner ? '#c9a84c' : '#bdc3c7'}`,
            padding: '3rem',
            borderRadius: '24px',
            boxShadow: `0 12px 48px ${isWinner ? 'rgba(201,168,76,0.3)' : 'rgba(0,0,0,0.8)'}`,
            textAlign: 'center',
            maxWidth: '500px'
          }}
        >
          <motion.h1
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            style={{ 
              color: isWinner ? 'var(--color-gold)' : 'var(--color-text-muted)', 
              fontSize: '3.5rem', 
              marginBottom: '1rem',
              fontFamily: 'var(--font-sinhala-serif), "Georgia", serif',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            {isWinner ? 'ජයග්‍රහණය' : 'පරාජය'}
          </motion.h1>
          <p style={{ color: 'var(--color-text-main)', fontSize: '1.2rem', marginBottom: '2rem', opacity: 0.8, fontFamily: 'var(--font-sinhala-sans), sans-serif' }}>
            {isWinner ? 'ඔබේ කණ්ඩායම ජය ගෙන ඇත!' : 'ඔබේ කණ්ඩායම පරාජය විය.'}
          </p>

          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginBottom: '3rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', color: 'var(--color-team0)', fontWeight: 'bold' }}>{gameState.katakola.team0}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-main)', opacity: 0.6, textTransform: 'uppercase' }}>Team 0</div>
            </div>
            <div style={{ fontSize: '2rem', color: 'var(--color-text-main)', opacity: 0.3, alignSelf: 'center' }}>-</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', color: 'var(--color-team1)', fontWeight: 'bold' }}>{gameState.katakola.team1}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-main)', opacity: 0.6, textTransform: 'uppercase' }}>Team 1</div>
            </div>
          </div>

          <button
            onClick={() => window.location.reload()} // For now, simple reload as a mock
            style={{
              background: isWinner ? 'linear-gradient(135deg, var(--color-gold-light), var(--color-gold))' : 'rgba(255,255,255,0.1)',
              color: isWinner ? 'var(--color-felt-dark)' : 'var(--color-text-main)',
              border: isWinner ? 'none' : '1px solid rgba(255,255,255,0.2)',
              padding: '1rem 2rem',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              letterSpacing: '0.05em',
              fontFamily: 'var(--font-sinhala-sans), sans-serif',
              transition: 'all 0.2s',
              boxShadow: isWinner ? '0 4px 16px rgba(201,164,92,0.4)' : 'none'
            }}
          >
            නැවත ක්‍රීඩා කරන්න
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
