'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Copy, Check, Crown, Loader2, Wifi, WifiOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Room, RoomPlayer } from '@/types/room';

type Team = 0 | 1;

function TeamBadge({ team }: { team: Team }) {
  const colors = {
    0: { bg: 'rgba(52,152,219,0.2)', border: 'rgba(52,152,219,0.4)', text: '#3498db', label: 'කණ්ඩායම 1' },
    1: { bg: 'rgba(230,126,34,0.2)', border: 'rgba(230,126,34,0.4)', text: '#e67e22', label: 'කණ්ඩායම 2' },
  };
  const c = colors[team];
  return (
    <span
      style={{
        fontSize: '0.7rem',
        fontWeight: 700,
        letterSpacing: '0.05em',
        fontFamily: 'var(--font-sinhala-sans), sans-serif',
        padding: '0.15rem 0.5rem',
        borderRadius: 6,
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
      }}
    >
      {c.label}
    </span>
  );
}

function PlayerSlot({
  player,
  index,
  isMe,
}: {
  player: RoomPlayer | null;
  index: number;
  isMe: boolean;
}) {
  const positions = ['Bottom', 'Right', 'Top', 'Left'];
  const isEmpty = player === null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '1rem 1.25rem',
        borderRadius: 14,
        background: isMe
          ? 'rgba(201,168,76,0.08)'
          : isEmpty
          ? 'rgba(255,255,255,0.02)'
          : 'rgba(255,255,255,0.04)',
        border: isMe
          ? '1px solid rgba(201,168,76,0.3)'
          : '1px solid rgba(255,255,255,0.06)',
        transition: 'all 0.2s ease',
        minHeight: 70,
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.3rem',
          fontWeight: 700,
          flexShrink: 0,
          background: isEmpty
            ? 'rgba(255,255,255,0.05)'
            : player.team === 0
            ? 'rgba(52,152,219,0.25)'
            : 'rgba(230,126,34,0.25)',
          border: isEmpty
            ? '1px dashed rgba(255,255,255,0.15)'
            : `2px solid ${player.team === 0 ? 'rgba(52,152,219,0.5)' : 'rgba(230,126,34,0.5)'}`,
          color: isEmpty ? 'rgba(255,255,255,0.2)' : '#f0ead8',
        }}
      >
        {isEmpty ? '?' : player.username[0].toUpperCase()}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {isEmpty ? (
          <p style={{ color: 'var(--color-text-main)', fontSize: '0.9rem', opacity: 0.6, fontFamily: 'var(--font-sinhala-sans), sans-serif' }}>
            ක්‍රීඩකයෙකු එනතෙක්...
          </p>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#f0ead8' }}>
                {player.username}
              </span>
              {player.isHost && (
                <Crown size={14} color="#c9a84c" />
              )}
              {isMe && (
                <span style={{ fontSize: '0.7rem', color: 'var(--color-gold)', opacity: 0.8, fontFamily: 'var(--font-sinhala-sans)' }}>
                  (ඔබ)
                </span>
              )}
              {player.isConnected ? (
                <Wifi size={12} color="rgba(39,174,96,0.8)" />
              ) : (
                <WifiOff size={12} color="rgba(231,76,60,0.8)" />
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
              <TeamBadge team={player.team as Team} />
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-main)', opacity: 0.5, fontFamily: 'var(--font-sinhala-sans)' }}>
                අසුන: {positions[player.position]}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Ready badge */}
      {!isEmpty && (
        <div
          style={{
            padding: '0.25rem 0.75rem',
            borderRadius: 20,
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
            background: player.isReady
              ? 'rgba(39,174,96,0.2)'
              : 'rgba(255,255,255,0.05)',
            border: player.isReady
              ? '1px solid rgba(39,174,96,0.4)'
              : '1px solid rgba(255,255,255,0.1)',
            color: player.isReady ? '#27ae60' : 'rgba(240,234,216,0.35)',
            flexShrink: 0,
            fontFamily: 'var(--font-sinhala-sans), sans-serif'
          }}
        >
          {player.isReady ? '✓ සූදානම්' : 'සූදානම් නැත'}
        </div>
      )}
    </motion.div>
  );
}

export default function LobbyPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = (params.code as string).toUpperCase();

  const [room, setRoom] = useState<Room | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myPlayer, setMyPlayer] = useState<RoomPlayer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [readyLoading, setReadyLoading] = useState(false);
  const [startLoading, setStartLoading] = useState(false);

  // Load room data
  const fetchRoom = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('rooms')
      .select('*, room_players(*, profiles(username, avatar_url))')
      .eq('code', roomCode)
      .single();

    if (error || !data) {
      console.error('fetchRoom error:', error);
      setError('Room not found: ' + (error?.message || 'No data'));
      return;
    }

    const players: RoomPlayer[] = (data.room_players ?? []).map((p: any) => ({
      id: p.id,
      userId: p.user_id,
      username: p.profiles?.username ?? 'Unknown',
      avatarUrl: p.profiles?.avatar_url ?? null,
      position: p.position,
      team: p.team,
      isReady: p.is_ready,
      isConnected: p.is_connected,
      isHost: p.is_host,
      joinedAt: p.joined_at,
    }));

    setRoom({
      id: data.id,
      code: data.code,
      hostId: data.host_id,
      status: data.status,
      players,
      maxPlayers: data.max_players,
      createdAt: data.created_at,
      expiresAt: data.expires_at,
    });
  }, [roomCode]);

  useEffect(() => {
    const userId = sessionStorage.getItem('omi_user_id');
    if (!userId) {
      router.replace('/room/join');
      return;
    }
    setMyUserId(userId);
    fetchRoom().then(() => setLoading(false));
  }, [fetchRoom, router]);

  // Update myPlayer when room updates
  useEffect(() => {
    if (room && myUserId) {
      const me = room.players.find((p) => p.userId === myUserId) ?? null;
      setMyPlayer(me);
    }
  }, [room, myUserId]);

  // Supabase Realtime subscription
  useEffect(() => {
    if (!room) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`room:${room.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${room.id}` },
        () => { fetchRoom(); },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` },
        (payload) => {
          if (payload.new.status === 'playing') {
            router.push(`/game/${roomCode}`);
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [room, fetchRoom, router, roomCode]);

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleReady = async () => {
    if (!room || !myUserId) return;
    setReadyLoading(true);
    try {
      await fetch('/api/room/ready', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: room.id, userId: myUserId }),
      });
      await fetchRoom();
    } finally {
      setReadyLoading(false);
    }
  };

  const startGame = async () => {
    if (!room || !myUserId) return;
    setStartLoading(true);
    try {
      const res = await fetch('/api/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: room.id, userId: myUserId }),
      });
      if (res.ok) {
        router.push(`/game/${roomCode}`);
      }
    } finally {
      setStartLoading(false);
    }
  };

  const allReady = room?.players.length === 4 && room.players.every((p) => p.isReady);
  const isHost = myPlayer?.isHost ?? false;

  // Build 4 slots (some may be empty)
  const slots = [0, 1, 2, 3].map((pos) =>
    room?.players.find((p) => p.position === pos) ?? null,
  );

  if (loading) {
    return (
      <main style={{ minHeight: '100dvh', background: '#0d1f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={36} color="#c9a84c" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ minHeight: '100dvh', background: '#0d1f0f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ color: '#e74c3c', fontSize: '1.1rem' }}>{error}</p>
        <button className="btn-secondary" onClick={() => router.push('/')}>Go Home</button>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: '100dvh',
        background: 'radial-gradient(ellipse at center top, #1a3d20 0%, #0d1f0f 60%, #050f07 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '2rem 1.5rem',
        gap: '1.5rem',
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center' }}
      >
        <h1
          className="font-display"
          style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            color: 'var(--color-gold)',
            fontFamily: 'var(--font-sinhala-serif), serif',
            letterSpacing: '0.05em',
            marginBottom: '0.25rem',
            textShadow: '0 2px 10px rgba(201,168,76,0.3)',
          }}
        >
          ඕමී ක්‍රීඩා කාමරය
        </h1>
        <p style={{ color: 'var(--color-text-main)', fontSize: '0.95rem', opacity: 0.7, fontFamily: 'var(--font-sinhala-sans)' }}>
          අනෙක් ක්‍රීඩකයින් කාමරයට එක්වනතුරු රැඳී සිටින්න
        </p>
      </motion.div>

      {/* Room code card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        style={{
          padding: '1.25rem 2rem',
          background: 'rgba(0,0,0,0.4)',
          borderRadius: 20,
          border: '1px solid rgba(201,168,76,0.25)',
          textAlign: 'center',
          boxShadow: '0 0 30px rgba(201,168,76,0.08)',
        }}
      >
        <p style={{ fontSize: '0.85rem', letterSpacing: '0.1em', color: 'var(--color-gold)', marginBottom: '0.4rem', fontFamily: 'var(--font-sinhala-sans)' }}>
          කාමරයේ කේතය
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center' }}>
          <span
            style={{
              fontSize: '2.5rem',
              fontWeight: 700,
              letterSpacing: '0.3em',
              fontFamily: 'monospace',
              color: '#e4c46b',
            }}
          >
            {roomCode}
          </span>
          <button
            id="copy-code-btn"
            onClick={copyCode}
            style={{
              background: 'rgba(201,168,76,0.15)',
              border: '1px solid rgba(201,168,76,0.3)',
              borderRadius: 10,
              padding: '0.4rem 0.8rem',
              cursor: 'pointer',
              color: copied ? '#27ae60' : '#c9a84c',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'පිටපත් කළා!' : 'පිටපත් කරන්න'}
          </button>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', opacity: 0.6, marginTop: '0.45rem', fontFamily: 'var(--font-sinhala-sans)' }}>
          මෙම කේතය ඔබේ මිතුරන් සමග බෙදාගන්න
        </p>
      </motion.div>

      {/* Players list */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          width: '100%',
          maxWidth: 520,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
          <h2 style={{ fontSize: '0.9rem', letterSpacing: '0.05em', color: 'var(--color-text-main)', opacity: 0.7, fontFamily: 'var(--font-sinhala-sans)' }}>
            ක්‍රීඩකයින් ({room?.players.length ?? 0}/4)
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-main)', opacity: 0.7, fontFamily: 'var(--font-sinhala-sans)' }}>
            <span style={{ color: '#3498db' }}>■</span> කණ්ඩායම 1
            <span style={{ color: '#e67e22', marginLeft: '0.5rem' }}>■</span> කණ්ඩායම 2
          </div>
        </div>

        {slots.map((player, i) => (
          <PlayerSlot
            key={i}
            player={player}
            index={i}
            isMe={player?.userId === myUserId}
          />
        ))}
      </motion.div>

      {/* Ready / Start buttons */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', maxWidth: 520 }}
      >
        {/* Ready toggle */}
        <button
          id="ready-btn"
          className={myPlayer?.isReady ? 'btn-secondary' : 'btn-primary'}
          onClick={toggleReady}
          disabled={readyLoading}
          style={{
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            background: myPlayer?.isReady ? 'rgba(231,76,60,0.15)' : undefined,
            border: myPlayer?.isReady ? '1px solid rgba(231,76,60,0.4)' : undefined,
            color: myPlayer?.isReady ? '#e74c3c' : undefined,
            fontFamily: 'var(--font-sinhala-sans), sans-serif',
          }}
        >
          {readyLoading ? (
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
          ) : myPlayer?.isReady ? (
            '✗ සූදානම් අවලංගු කරන්න'
          ) : (
            '✓ සූදානම් වන්න'
          )}
        </button>

        {/* Host-only start button */}
        <AnimatePresence>
          {isHost && allReady && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              id="start-game-btn"
              className="btn-primary animate-glow-pulse"
              onClick={startGame}
              disabled={startLoading}
              style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontFamily: 'var(--font-sinhala-sans), sans-serif',
              }}
            >
              {startLoading ? (
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                '♠ තරඟය ආරම්භ කරන්න'
              )}
            </motion.button>
          )}
        </AnimatePresence>

        {isHost && !allReady && (
          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-main)', opacity: 0.6, fontFamily: 'var(--font-sinhala-sans)' }}>
            {room?.players.length === 4
              ? 'අනෙක් ක්‍රීඩකයින් සූදානම් වනතුරු රැඳී සිටින්න...'
              : `තවත් ක්‍රීඩකයින් ${4 - (room?.players.length ?? 0)} දෙනෙකු අවශ්‍යයි`}
          </p>
        )}
      </motion.div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}
