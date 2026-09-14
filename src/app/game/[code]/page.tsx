'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useGameStore } from '@/store/gameStore';
import { PublicGameState, Position, Card as CardType } from '@/types/game';

// Card engine imports
import {
  Card,
  CardBack,
  Deck,
  PlayerHand,
  TrickArea,
  ShuffleAnimation,
  CardDealAnimation,
  CardCollectionAnimation,
  DealInstruction,
} from '@/components/cards';
import { FullCourtOverlay } from '@/components/game/FullCourtOverlay';
import { HalfCourtOverlay } from '@/components/game/HalfCourtOverlay';
import { KatakolaBoard } from '@/components/game/KatakolaBoard';
import { KatakolaTransferAnimation } from '@/components/game/KatakolaTransferAnimation';
import { EventPopup } from '@/components/game/EventPopup';
import { MatchEndOverlay } from '@/components/game/MatchEndOverlay';
import { GameSidebar } from '@/components/game/GameSidebar';

// Old KatakolaStrip removed as we now use KatakolaBoard.

// ── Opponent seat (face-down hand) ────────────────────────────────────────────

function OpponentSeat({
  player,
  cardCount,
  isCurrentTurn,
  position,
  isInactive,
  seatRef,
}: {
  player: { username: string; team: 0 | 1; isConnected: boolean } | null;
  cardCount: number;
  isCurrentTurn: boolean;
  position: 'top' | 'left' | 'right';
  isInactive?: boolean;
  seatRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const isHorizontal = position === 'left' || position === 'right';
  const rotClass = position === 'top' ? 'opponent-hand-top'
    : position === 'left' ? 'opponent-hand-left'
    : 'opponent-hand-right';

  const avatarInitials = player?.username?.slice(0, 2).toUpperCase() || '?';
  const teamColor = player?.team === 0 ? 'var(--color-team0)' : 'var(--color-team1)';

  return (
    <motion.div
      ref={seatRef}
      animate={isCurrentTurn ? { scale: [1, 1.05, 1] } : { scale: 1 }}
      transition={{ repeat: isCurrentTurn ? Infinity : 0, duration: 2, ease: "easeInOut" }}
      style={{
        display:       'flex',
        flexDirection: position === 'top' ? 'column' : position === 'left' ? 'row' : 'row-reverse',
        alignItems:    'center',
        gap:           '1.5rem',
        opacity:       isInactive ? 0.25 : 1,
        filter:        isInactive ? 'grayscale(0.8)' : 'none',
      }}
    >
      <AnimatePresence>
        {isInactive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
              background: 'rgba(0,0,0,0.8)',
              border: `1px solid ${teamColor}`,
              color: teamColor,
              padding: '0.4rem 0.8rem',
              borderRadius: '8px',
              fontSize: '0.7rem',
              fontWeight: 800,
              whiteSpace: 'nowrap',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            }}
          >
            PLAYER OUT
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        {/* Avatar Ring */}
        <div style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: isCurrentTurn ? `2px solid var(--color-gold-light)` : `2px solid var(--color-gold-dark)`,
          background: 'linear-gradient(135deg, #12352A, #08130F)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isCurrentTurn 
            ? '0 0 16px var(--color-gold-glow), inset 0 0 10px rgba(0,0,0,0.8)' 
            : 'inset 0 0 10px rgba(0,0,0,0.8), 0 4px 12px rgba(0,0,0,0.5)',
          position: 'relative',
          fontFamily: 'var(--font-sinhala-sans), sans-serif',
          fontWeight: 700,
          color: isCurrentTurn ? 'var(--color-gold-light)' : 'var(--color-gold-dark)',
          fontSize: '1.2rem',
          opacity: player?.isConnected ? 1 : 0.4,
          transition: 'all 0.3s ease',
        }}>
          {avatarInitials}
          <div style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 12,
            height: 12,
            borderRadius: '50%',
            border: '2px solid #08130F',
            backgroundColor: player?.isConnected ? 'var(--color-success)' : 'var(--color-danger)'
          }} />
        </div>

        {/* Name badge */}
        <div style={{
          padding:       '0.25rem 0.75rem',
          borderRadius:  16,
          background:    isCurrentTurn ? 'rgba(201,164,92,0.1)' : 'rgba(0,0,0,0.6)',
          border:        `1px solid ${teamColor}`,
          fontSize:      '0.75rem',
          fontWeight:    600,
          fontFamily:    'var(--font-sinhala-sans), sans-serif',
          color:         isCurrentTurn ? 'var(--color-text-main)' : 'var(--color-text-muted)',
          whiteSpace:    'nowrap',
          boxShadow:     '0 2px 4px rgba(0,0,0,0.5)',
          opacity:       player?.isConnected ? 1 : 0.5,
        }}>
          {player?.username ?? '…'}
        </div>
      </div>

      {/* Face-down hand */}
      {cardCount > 0 && (
        <div
          className={rotClass}
          style={{
            display:  'flex',
            position: 'relative',
            height:   67 + (cardCount - 1) * 2,
          }}
        >
          {Array.from({ length: cardCount }).map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left:     i * 14,
                zIndex:   i,
              }}
            >
              <CardBack size="sm" rotate={(i - (cardCount - 1) / 2) * 1.5} />
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ── Game Page ─────────────────────────────────────────────────────────────────

export default function GamePage() {
  const params    = useParams();
  const router    = useRouter();
  const roomCode  = (params.code as string).toUpperCase();

  const {
    gameState, myHand, legalPlays,
    setGameState, setPrivateState,
    myPosition, setMyPosition, setMyUserId,
    isMyTurn,
  } = useGameStore();

  const [loading, setLoading]                     = useState(true);
  const [gameId,  setGameId]                      = useState<string | null>(null);

  // ── Animation states ──────────────────────────────────────────────
  const [shuffleVisible,   setShuffleVisible]     = useState(false);
  const [dealVisible,      setDealVisible]        = useState(false);
  const [dealInstructions, setDealInstructions]   = useState<DealInstruction[]>([]);
  const [collectVisible,   setCollectVisible]     = useState(false);
  const [collectWinner,    setCollectWinner]      = useState<Position>(0);
  const [trickWinner,      setTrickWinner]        = useState<Position | null>(null);

  // ── Refs for deal animation position measurement ──────────────────
  const deckRef   = useRef<HTMLDivElement>(null);
  const seat0Ref  = useRef<HTMLDivElement>(null); // bottom (me)
  const seat1Ref  = useRef<HTMLDivElement>(null); // right
  const seat2Ref  = useRef<HTMLDivElement>(null); // top
  const seat3Ref  = useRef<HTMLDivElement>(null); // left

  const seatRefs  = { 0: seat0Ref, 1: seat1Ref, 2: seat2Ref, 3: seat3Ref };

  // Track previous hand length to detect new dealt cards
  const prevHandLenRef = useRef(0);

  // ── Initial load ──────────────────────────────────────────────────
  useEffect(() => {
    const userId = sessionStorage.getItem('omi_user_id');
    if (!userId) { router.replace('/'); return; }
    setMyUserId(userId);

    const supabase = createClient();

    const load = async () => {
      const { data: room } = await supabase
        .from('rooms')
        .select('id, room_players(position, user_id)')
        .eq('code', roomCode)
        .single();

      if (!room) { router.replace(`/room/${roomCode}`); return; }

      const me = (room.room_players as any[]).find((p: any) => p.user_id === userId);
      if (me) setMyPosition(me.position);

      const { data: game } = await supabase
        .from('games')
        .select('id')
        .eq('room_id', room.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!game) { setLoading(false); return; }
      
      setGameId(game.id);

      // Fetch the current server-authoritative state so we can immediately resume
      try {
        const res = await fetch('/api/game/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameId: game.id, userId }),
        });
        
        if (res.ok) {
          const { publicState, privateState } = await res.json();
          if (publicState) setGameState(publicState);
          if (privateState) setPrivateState(privateState);
        }
      } catch (err) {
        console.error('Failed to sync game state on reconnect', err);
      }

      setLoading(false);
    };

    load();
  }, [roomCode, router, setMyPosition, setMyUserId]);

  // ── Realtime subscriptions ────────────────────────────────────────
  useEffect(() => {
    if (!gameId) return;
    const userId = sessionStorage.getItem('omi_user_id');
    if (!userId) return;

    const supabase = createClient();

    // Public game state
    const publicChannel = supabase
      .channel(`game:${gameId}:public`)
      .on('broadcast', { event: 'game_state' }, ({ payload }) => {
        setGameState(payload.state as PublicGameState);
      })
      .on('broadcast', { event: 'dealer_action' }, ({ payload }) => {
        if (payload.action === 'shuffle') {
          setShuffleVisible(true);
        }
      })
      .on('broadcast', { event: 'trick_result' }, ({ payload }) => {
        if (payload.trick?.winnerPosition != null) {
          setTrickWinner(payload.trick.winnerPosition);
          setCollectWinner(payload.trick.winnerPosition);
          setTimeout(() => {
            setCollectVisible(true);
          }, 150);
        }
      })
      .subscribe();

    // Private hand channel
    const privateChannel = supabase
      .channel(`game:${gameId}:player:${userId}`)
      .on('broadcast', { event: 'player_hand' }, ({ payload }) => {
        setPrivateState({ hand: payload.hand, legalPlays: payload.legalPlays });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(publicChannel);
      supabase.removeChannel(privateChannel);
    };
  }, [gameId, setGameState, setPrivateState]);

  // ── Detect new cards in hand → trigger deal animation ─────────────
  useEffect(() => {
    const newLen = myHand.length;
    const oldLen = prevHandLenRef.current;
    prevHandLenRef.current = newLen;

    if (newLen > oldLen && myPosition !== null) {
      // Build deal instructions for newly received cards
      // We don't know the exact order from server, so create a visual sequence
      const phase = gameState?.phase;
      const isDealing = phase === 'dealing_first' || phase === 'dealing_rest';

      if (isDealing) {
        const newCardCount = newLen - oldLen;
        const instructions: DealInstruction[] = [];

        // Build round-the-table sequence  
        const positions: Position[] = [0, 1, 2, 3];
        for (let card = 0; card < newCardCount; card++) {
          for (const pos of positions) {
            instructions.push({
              toPosition: pos,
              delay:      (instructions.length) * 0.09,
            });
          }
          if (instructions.length >= newCardCount * 4) break;
        }

        // Only show my cards arriving
        const myInstructions = instructions
          .filter(d => d.toPosition === myPosition)
          .slice(0, newCardCount);

        if (myInstructions.length > 0) {
          setDealInstructions(myInstructions);
          setDealVisible(true);
        }
      }
    }
  }, [myHand.length, myPosition, gameState?.phase]);

  // ── Card exchange handled by FullCourtOverlay ────────────────────

  // ── Play a card ───────────────────────────────────────────────────
  const handlePlayCard = useCallback(async (cardId: string) => {
    const userId = sessionStorage.getItem('omi_user_id');
    if (!userId || !gameId) return;

    try {
      await fetch('/api/game/play-card', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ gameId, cardId, userId }),
      });
    } catch (err) {
      console.error('Failed to play card', err);
    }
  }, [gameId]);

  // ── Loading screen ────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', background: '#0d1f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <Loader2 size={36} color="#c9a84c" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'rgba(240,234,216,0.5)', fontSize: '0.9rem' }}>Loading game…</p>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Derived values ────────────────────────────────────────────────
  const katakola    = gameState?.katakola ?? { team0: 10, team1: 10, bonusPool: 0 };
  const currentTurn = gameState?.currentTrick?.currentTurn;
  const players     = gameState?.players ?? [];

  const getRelativePlayer = (offset: number) => {
    if (myPosition === null) return null;
    const targetPos = ((myPosition + offset) % 4) as Position;
    return players.find((p) => p.position === targetPos) ?? null;
  };

  const topPlayer   = getRelativePlayer(2);
  const rightPlayer = getRelativePlayer(1);
  const leftPlayer  = getRelativePlayer(3);

  // Relative seat ref map (0=me bottom, 1=right, 2=top, 3=left)
  const relativeSeatRef = (relOffset: number): React.RefObject<HTMLDivElement | null> => {
    if (myPosition === null) return seat0Ref;
    const absPos = ((myPosition + relOffset) % 4) as Position;
    return seatRefs[absPos];
  };

  // ── Render ────────────────────────────────────────────────────────
  return (
    <>
      {/* Main game container */}
      <div className="game-container">
        
        {/* The Oval Table */}
        <div className="oval-table">
          
          {/* ── Top player ── */}
          <div className="seat-top">
            <OpponentSeat
              seatRef={relativeSeatRef(2) as React.RefObject<HTMLDivElement | null>}
              player={topPlayer ? { username: topPlayer.username, team: topPlayer.team as 0|1, isConnected: topPlayer.isConnected } : null}
              cardCount={topPlayer?.cardCount ?? 0}
              isCurrentTurn={currentTurn === topPlayer?.position}
              position="top"
              isInactive={topPlayer ? !topPlayer.isActive : false}
            />
          </div>

          {/* ── Left player ── */}
          <div className="seat-left">
            <OpponentSeat
              seatRef={relativeSeatRef(3) as React.RefObject<HTMLDivElement | null>}
              player={leftPlayer ? { username: leftPlayer.username, team: leftPlayer.team as 0|1, isConnected: leftPlayer.isConnected } : null}
              cardCount={leftPlayer?.cardCount ?? 0}
              isCurrentTurn={currentTurn === leftPlayer?.position}
              position="left"
              isInactive={leftPlayer ? !leftPlayer.isActive : false}
            />
          </div>

          {/* ── Right player ── */}
          <div className="seat-right">
            <OpponentSeat
              seatRef={relativeSeatRef(1) as React.RefObject<HTMLDivElement | null>}
              player={rightPlayer ? { username: rightPlayer.username, team: rightPlayer.team as 0|1, isConnected: rightPlayer.isConnected } : null}
              cardCount={rightPlayer?.cardCount ?? 0}
              isCurrentTurn={currentTurn === rightPlayer?.position}
              position="right"
              isInactive={rightPlayer ? !rightPlayer.isActive : false}
            />
          </div>

          {/* ── Center area (deck + trick) ── */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Deck (dealing source) */}
            {(gameState?.phase === 'dealing_first' || gameState?.phase === 'dealing_rest' || gameState?.phase === 'waiting') && (
              <div style={{ position: 'absolute', zIndex: 2 }}>
                <Deck
                  ref={deckRef}
                  cardCount={32}
                  size="sm"
                />
              </div>
            )}

            {/* Center Table Emblem (ඕමී) */}
            <div style={{
              position: 'absolute',
              zIndex: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.15, // Subtle engraved feel
              pointerEvents: 'none',
              transform: 'translateY(-10px)'
            }}>
              <div style={{
                width: 160,
                height: 160,
                borderRadius: '50%',
                border: '1px solid var(--color-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
              }}>
                <div style={{
                  width: 140,
                  height: 140,
                  borderRadius: '50%',
                  border: '1px dashed var(--color-gold-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-sinhala-serif)',
                    fontSize: '3rem',
                    color: 'var(--color-gold)',
                    textShadow: '0 2px 10px rgba(0,0,0,0.8)'
                  }}>
                    ඕමී
                  </span>
                </div>
              </div>
            </div>

            {/* Trick area */}
            {gameState && (
              <TrickArea
                plays={gameState.currentTrick?.plays ?? []}
                myPosition={myPosition ?? 0}
                winnerPosition={trickWinner}
                trumpSuit={gameState.trumpSuit}
                phase={gameState.phase}
              />
            )}

            {/* Phase label */}
            <div style={{
              position:       'absolute',
              bottom:         '15%',
              left:           '50%',
              transform:      'translateX(-50%)',
              padding:        '0.4rem 1.2rem',
              background:     'rgba(0,0,0,0.6)',
              borderRadius:   20,
              fontSize:       '0.8rem',
              color:          'rgba(240,234,216,0.8)',
              letterSpacing:  '0.1em',
              textTransform:  'uppercase',
              whiteSpace:     'nowrap',
              backdropFilter: 'blur(8px)',
              border:         '1px solid rgba(201,168,76,0.3)',
            }}>
              {gameState?.phase?.replace(/_/g, ' ') ?? 'Connecting…'}
            </div>
          </div>

          {/* ── My hand (bottom) ── */}
          <div className="seat-bottom" ref={seat0Ref}>
            {myHand.length > 0 ? (
              <PlayerHand
                cards={myHand}
                legalPlays={legalPlays}
                isMyTurn={isMyTurn}
                onPlay={handlePlayCard}
              />
            ) : (
              !loading && (
                <p style={{ color: 'rgba(240,234,216,0.2)', fontSize: '0.85rem' }}>
                  {gameState ? 'No cards in hand' : 'Waiting for game to start…'}
                </p>
              )
            )}
          </div>
        </div>
      </div>

      {/* ── Animation overlays (outside grid, fixed) ── */}

      <AnimatePresence>
        {shuffleVisible && (
          <ShuffleAnimation
            key="shuffle"
            visible={shuffleVisible}
            onComplete={() => setShuffleVisible(false)}
          />
        )}
      </AnimatePresence>

      <CardDealAnimation
        deals={dealInstructions}
        deckRef={deckRef}
        seatRefs={seatRefs as any}
        visible={dealVisible}
        onComplete={() => setDealVisible(false)}
      />

      <CardCollectionAnimation
        visible={collectVisible}
        winnerPosition={collectWinner}
        myPosition={myPosition ?? 0}
        onComplete={() => {
          setCollectVisible(false);
          setTrickWinner(null);
        }}
      />

      <FullCourtOverlay gameState={gameState} myPosition={myPosition} />
      <HalfCourtOverlay gameState={gameState} myPosition={myPosition} />
      {gameState?.katakola && (
        <KatakolaBoard katakola={gameState.katakola} myTeam={myPosition !== null ? (myPosition % 2 as any) : null} />
      )}
      {gameState?.roundResult && (
        <KatakolaTransferAnimation
          transaction={gameState.roundResult.transaction}
          myTeam={myPosition !== null ? (myPosition % 2 as 0|1) : null}
        />
      )}

      {/* Saporu / Kapothi Popups */}
      <EventPopup roundResult={gameState?.roundResult ?? null} />

      <MatchEndOverlay gameState={gameState} myTeam={myPosition !== null ? (myPosition % 2 as any) : null} />
      <GameSidebar />

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
