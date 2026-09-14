'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function JoinRoomPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !code.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/room/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          code: code.trim().toUpperCase(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed to join room');
        return;
      }

      sessionStorage.setItem('omi_user_id', data.userId);
      sessionStorage.setItem('omi_username', username.trim());

      if (data.accessToken && data.refreshToken) {
        const supabase = createClient();
        await supabase.auth.setSession({
          access_token: data.accessToken,
          refresh_token: data.refreshToken,
        });
      }

      router.push(`/room/${data.room.code}`);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
  };

  return (
    <main
      style={{
        minHeight: '100dvh',
        background: 'radial-gradient(ellipse at center top, #1a3d20 0%, #0d1f0f 60%, #050f07 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        position: 'relative',
      }}
    >
      <Link
        href="/"
        style={{
          position: 'absolute',
          top: '1.5rem',
          left: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          color: 'rgba(201,168,76,0.7)',
          fontSize: '0.875rem',
          textDecoration: 'none',
          transition: 'color 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#c9a84c')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(201,168,76,0.7)')}
      >
        <ArrowLeft size={16} /> Back
      </Link>

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, type: 'spring', stiffness: 260 }}
        style={{
          width: '100%',
          maxWidth: 440,
          padding: '2.5rem',
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(201,168,76,0.2)',
          borderRadius: 24,
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>♥</div>
          <h1
            className="font-display"
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #e4c46b, #c9a84c)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '0.4rem',
            }}
          >
            Join a Room
          </h1>
          <p style={{ color: 'rgba(240,234,216,0.5)', fontSize: '0.9rem' }}>
            Enter the 6-character room code
          </p>
        </div>

        <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Room code */}
          <div>
            <label
              htmlFor="room-code"
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'rgba(201,168,76,0.8)',
                marginBottom: '0.5rem',
              }}
            >
              Room Code
            </label>
            <input
              id="room-code"
              type="text"
              className="input-field"
              placeholder="e.g. AB12CD"
              value={code}
              onChange={handleCodeChange}
              maxLength={6}
              style={{
                textAlign: 'center',
                fontSize: '1.75rem',
                fontWeight: 700,
                letterSpacing: '0.3em',
                fontFamily: 'monospace',
              }}
              autoFocus
              required
            />
          </div>

          {/* Username */}
          <div>
            <label
              htmlFor="username"
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'rgba(201,168,76,0.8)',
                marginBottom: '0.5rem',
              }}
            >
              Your Name
            </label>
            <input
              id="username"
              type="text"
              className="input-field"
              placeholder="e.g. Nimali"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={20}
              required
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: '0.75rem 1rem',
                background: 'rgba(231,76,60,0.15)',
                border: '1px solid rgba(231,76,60,0.3)',
                borderRadius: 8,
                color: '#e74c3c',
                fontSize: '0.875rem',
              }}
            >
              {error}
            </motion.p>
          )}

          <button
            id="join-room-submit"
            type="submit"
            className="btn-primary"
            disabled={loading || code.length < 6 || username.trim().length < 2}
            style={{
              marginTop: '0.25rem',
              opacity: loading || code.length < 6 || username.trim().length < 2 ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontSize: '1rem',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                Joining…
              </>
            ) : (
              'Join Room'
            )}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(201,168,76,0.1)' }} />
          <span style={{ color: 'rgba(240,234,216,0.3)', fontSize: '0.8rem' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(201,168,76,0.1)' }} />
        </div>

        <Link href="/room/create" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
          <button className="btn-secondary" style={{ width: '100%', fontSize: '0.95rem' }}>
            Create New Room
          </button>
        </Link>
      </motion.div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}
