'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KatakolaState, Team } from '@/types/game';

interface KatakolaBoardProps {
  katakola: KatakolaState;
  myTeam: Team | null;
}

function Token({ id, index, team, isOurs }: { id: string; index: number; team: Team; isOurs: boolean }) {
  // Stacking offset so they look like a messy pile or overlapping row
  const xOffset = isOurs ? index * 14 : -(index * 14);
  
  return (
    <motion.div
      layoutId={`katakola-token-${id}`}
      initial={{ opacity: 0, scale: 0, y: -50 }}
      animate={{ opacity: 1, scale: 1, x: xOffset, y: 0 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ 
        layout: { type: 'spring', damping: 20, stiffness: 150 },
        default: { type: 'spring', damping: 20, stiffness: 200 }
      }}
      style={{
        position: 'absolute',
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: team === 0 
          ? 'radial-gradient(circle at 35% 35%, var(--color-gold-light), var(--color-gold), var(--color-gold-dark))' 
          : 'radial-gradient(circle at 35% 35%, #e0e0e0, #7f8c8d, #424949)',
        border: team === 0 ? '2px solid rgba(255,255,255,0.3)' : '2px solid rgba(255,255,255,0.2)',
        boxShadow: '0 6px 12px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.5)',
        zIndex: index,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // Slight random rotation for organic feel
        transform: `rotate(${(index % 3 - 1) * 15}deg)`
      }}
    >
      <div style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        border: '1px solid rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.7,
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
      }}>
        <span style={{ fontSize: '14px', color: 'rgba(0,0,0,0.6)', fontWeight: 'bold', fontFamily: 'var(--font-sinhala-serif)' }}>ක</span>
      </div>
    </motion.div>
  );
}

export function KatakolaBoard({ katakola, myTeam }: KatakolaBoardProps) {
  // If we don't know our team yet, assume team 0 is bottom
  const team0IsOurs = myTeam === null ? true : myTeam === 0;

  // We assign unique IDs based on a fixed global pool.
  // When a token is transferred, its ID moves from one array to another,
  // triggering Framer Motion's layoutId animation.
  // Team 0 holds tokens 0 to team0 - 1. Team 1 holds tokens 19 down to 20 - team1.
  const team0Tokens = Array.from({ length: katakola.team0 }).map((_, i) => `token-${i}`);
  const team1Tokens = Array.from({ length: katakola.team1 }).map((_, i) => `token-${19 - i}`);

  return (
    <>
      {/* Team 0 Katakola (Bottom Left) */}
      <div style={{
        position: 'fixed',
        bottom: 32,
        left: 32,
        width: 200,
        height: 60,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center'
      }}>
        <div style={{
          position: 'absolute',
          top: -28,
          left: 0,
          color: team0IsOurs ? 'var(--color-gold)' : 'var(--color-text-muted)',
          fontSize: '0.85rem',
          fontWeight: 700,
          fontFamily: 'var(--font-sinhala-sans)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          කටකොළ {team0IsOurs ? '(ඔබේ කණ්ඩායම)' : '(ප්‍රතිවාදීන්)'}
        </div>
        <AnimatePresence>
          {team0Tokens.map((id, index) => (
            <Token key={id} id={id} index={index} team={0} isOurs={true} />
          ))}
        </AnimatePresence>
      </div>

      {/* Team 1 Katakola (Top Right) */}
      <div style={{
        position: 'fixed',
        top: 32,
        right: 32,
        width: 200,
        height: 60,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end'
      }}>
        <div style={{
          position: 'absolute',
          bottom: -28,
          right: 0,
          color: !team0IsOurs ? 'var(--color-gold)' : 'var(--color-text-muted)',
          fontSize: '0.85rem',
          fontWeight: 700,
          fontFamily: 'var(--font-sinhala-sans)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          textAlign: 'right'
        }}>
          කටකොළ {!team0IsOurs ? '(ඔබේ කණ්ඩායම)' : '(ප්‍රතිවාදීන්)'}
        </div>
        <AnimatePresence>
          {team1Tokens.map((id, index) => (
            <Token key={id} id={id} index={index} team={1} isOurs={false} />
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
