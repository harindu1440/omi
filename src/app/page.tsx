'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, Shield, Zap, Heart, Spade, Diamond, Club } from 'lucide-react';

// Suit symbol component
function SuitSymbol({ suit }: { suit: 'spades' | 'hearts' | 'diamonds' | 'clubs' }) {
  const symbols = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' };
  const colors = {
    spades: '#1a1a2e',
    hearts: '#c0392b',
    diamonds: '#c0392b',
    clubs: '#1a1a2e',
  };
  return (
    <span style={{ color: colors[suit], fontSize: 'inherit' }}>{symbols[suit]}</span>
  );
}

// Decorative floating card
function FloatingCard({
  rank,
  suit,
  style,
  delay = 0,
}: {
  rank: string;
  suit: 'spades' | 'hearts' | 'diamonds' | 'clubs';
  style?: React.CSSProperties;
  delay?: number;
}) {
  const isRed = suit === 'hearts' || suit === 'diamonds';
  const suitSymbols = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' };
  const suitColor = isRed ? '#c0392b' : '#1a1a2e';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotate: 0 }}
      animate={{ opacity: 1, y: [0, -8, 0], rotate: [0, 2, -2, 0] }}
      transition={{
        opacity: { duration: 0.5, delay },
        y: { duration: 4, delay, repeat: Infinity, ease: 'easeInOut' },
        rotate: { duration: 6, delay: delay + 1, repeat: Infinity, ease: 'easeInOut' },
      }}
      style={{
        position: 'absolute',
        ...style,
      }}
    >
      <div
        style={{
          width: 64,
          height: 90,
          background: '#faf8f4',
          border: '1px solid #e8e0d0',
          borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '6px',
          color: suitColor,
          fontFamily: 'Georgia, serif',
          fontWeight: '700',
          fontSize: '16px',
        }}
      >
        <div style={{ lineHeight: 1 }}>
          <div>{rank}</div>
          <div style={{ fontSize: '12px' }}>{suitSymbols[suit]}</div>
        </div>
        <div style={{ textAlign: 'center', fontSize: '22px' }}>{suitSymbols[suit]}</div>
        <div style={{ transform: 'rotate(180deg)', lineHeight: 1 }}>
          <div>{rank}</div>
          <div style={{ fontSize: '12px' }}>{suitSymbols[suit]}</div>
        </div>
      </div>
    </motion.div>
  );
}

const FEATURES = [
  {
    icon: Users,
    title: '4-Player Multiplayer',
    desc: 'Play with friends anywhere. Private rooms with 6-character codes.',
  },
  {
    icon: Shield,
    title: 'Authentic Rules',
    desc: 'Full Omi rules with Half Court, Full Court, Kapothi, and Katakola tokens.',
  },
  {
    icon: Zap,
    title: 'Real-Time Play',
    desc: 'Instant card plays, smooth animations, 60 FPS gameplay.',
  },
];

export default function LandingPage() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        background: 'radial-gradient(ellipse at center top, #1a3d20 0%, #0d1f0f 60%, #050f07 100%)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Decorative felt rim */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.08) 0%, transparent 60%),
            radial-gradient(ellipse at 0% 50%, rgba(201,168,76,0.04) 0%, transparent 50%),
            radial-gradient(ellipse at 100% 50%, rgba(201,168,76,0.04) 0%, transparent 50%)
          `,
          pointerEvents: 'none',
        }}
      />

      {/* Floating cards decoration */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <FloatingCard rank="A" suit="spades" style={{ top: '12%', left: '6%', rotate: '-15deg', opacity: 0.6 }} delay={0} />
        <FloatingCard rank="K" suit="hearts" style={{ top: '20%', right: '8%', rotate: '12deg', opacity: 0.7 }} delay={0.3} />
        <FloatingCard rank="Q" suit="diamonds" style={{ top: '55%', left: '4%', rotate: '8deg', opacity: 0.5 }} delay={0.6} />
        <FloatingCard rank="J" suit="clubs" style={{ top: '60%', right: '5%', rotate: '-10deg', opacity: 0.55 }} delay={0.9} />
        <FloatingCard rank="10" suit="hearts" style={{ top: '80%', left: '15%', rotate: '5deg', opacity: 0.4 }} delay={1.2} />
        <FloatingCard rank="A" suit="diamonds" style={{ top: '75%', right: '18%', rotate: '-8deg', opacity: 0.45 }} delay={1.5} />
      </div>

      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem 2rem',
          borderBottom: '1px solid rgba(201,168,76,0.1)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div
          className="font-display"
          style={{
            fontSize: '1.8rem',
            fontWeight: 800,
            color: 'var(--color-gold)',
            fontFamily: 'var(--font-sinhala-serif), serif',
            letterSpacing: '0.05em',
            textShadow: '0 2px 10px rgba(201,168,76,0.3)',
          }}
        >
          ♠ ඕමී ♣
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/room/join">
            <button className="btn-secondary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
              Join Game
            </button>
          </Link>
          <Link href="/room/create">
            <button className="btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
              Create Room
            </button>
          </Link>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '3rem 1.5rem',
          position: 'relative',
          zIndex: 5,
          gap: '2rem',
        }}
      >
        {/* Suit symbols row */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{ display: 'flex', gap: '1rem', fontSize: '2rem' }}
        >
          {(['spades', 'hearts', 'diamonds', 'clubs'] as const).map((suit, i) => (
            <motion.span
              key={suit}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1, duration: 0.4 }}
            >
              <SuitSymbol suit={suit} />
            </motion.span>
          ))}
        </motion.div>

        {/* Main heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <h1
            className="font-display"
            style={{
              fontSize: 'clamp(4rem, 10vw, 7rem)',
              fontWeight: 900,
              lineHeight: 1,
              color: 'var(--color-gold)',
              fontFamily: 'var(--font-sinhala-serif), serif',
              letterSpacing: '0.02em',
              marginBottom: '0.5rem',
              textShadow: '0 8px 32px rgba(0,0,0,0.8), 0 0 20px rgba(201,168,76,0.4)',
            }}
          >
            ඕමී
          </h1>
          <p
            style={{
              fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
              color: 'var(--color-text-main)',
              fontFamily: 'var(--font-sinhala-sans), sans-serif',
              letterSpacing: '0.05em',
              opacity: 0.8,
            }}
          >
            ශ්‍රී ලංකාවේ ප්‍රියතම කාඩ් ක්‍රීඩාව
          </p>
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          style={{
            maxWidth: '540px',
            fontSize: '1.05rem',
            lineHeight: 1.7,
            color: 'var(--color-text-main)',
            opacity: 0.7,
            fontFamily: 'var(--font-sinhala-sans), sans-serif',
          }}
        >
          ක්‍රීඩකයන් හතරයි. කණ්ඩායම් දෙකයි. කාඩ්පත් 32 යි. සාම්ප්‍රදායික ශ්‍රී ලාංකීය 
          කාඩ් ක්‍රීඩාව — දැන් අන්තර්ජාලය හරහා මිතුරන් සමග ක්‍රීඩා කරන්න.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}
        >
          <Link href="/room/create">
            <button
              className="btn-primary"
              style={{ fontSize: '1.05rem', padding: '0.875rem 2.5rem', fontFamily: 'var(--font-sinhala-sans), sans-serif' }}
              id="create-room-btn"
            >
              කාමරයක් සාදන්න
            </button>
          </Link>
          <Link href="/room/join">
            <button
              className="btn-secondary"
              style={{ fontSize: '1.05rem', padding: '0.875rem 2.5rem', fontFamily: 'var(--font-sinhala-sans), sans-serif' }}
              id="join-room-btn"
            >
              කාමරයකට එක්වන්න
            </button>
          </Link>
        </motion.div>

        {/* Katakola token display */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 40,
            border: '1px solid rgba(201,168,76,0.15)',
          }}
        >
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-main)', opacity: 0.5, marginRight: '0.25rem', fontFamily: 'var(--font-sinhala-sans), sans-serif' }}>කටකොළ</span>
          {Array.from({ length: 10 }).map((_, i) => (
            <motion.div
              key={i}
              className="katakola-token"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.75 + i * 0.05, type: 'spring', stiffness: 400 }}
              style={{ width: 22, height: 22, fontSize: '8px' }}
            />
          ))}
        </motion.div>
      </section>

      {/* Features Section */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.8 }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          padding: '2rem',
          borderTop: '1px solid rgba(201,168,76,0.1)',
          position: 'relative',
          zIndex: 5,
        }}
      >
        {FEATURES.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85 + i * 0.1 }}
            style={{
              padding: '1.5rem',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 16,
              border: '1px solid rgba(201,168,76,0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'rgba(201,168,76,0.15)',
                border: '1px solid rgba(201,168,76,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <feature.icon size={22} color="#c9a84c" />
            </div>
            <h3
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '1.05rem',
                fontWeight: 600,
                color: '#f0ead8',
              }}
            >
              {feature.title}
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'rgba(240,234,216,0.55)', lineHeight: 1.6 }}>
              {feature.desc}
            </p>
          </motion.div>
        ))}
      </motion.section>

      {/* Footer */}
      <footer
        style={{
          textAlign: 'center',
          padding: '1.25rem',
          borderTop: '1px solid rgba(201,168,76,0.08)',
          color: 'rgba(240,234,216,0.3)',
          fontSize: '0.8rem',
          position: 'relative',
          zIndex: 5,
        }}
      >
        Omi · A friendly Sri Lankan card game · No real-money gambling
      </footer>
    </main>
  );
}
