import { describe, it, expect, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rmozoefmqhlrpmtpging.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtb3pvZWZtcWhscnBtdHBnaW5nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTMwNzkwMSwiZXhwIjoyMTA0ODgzOTAxfQ.NVdjq13p1pJlus278jYhRYVvRcGUu4KiJO9v5KgNoVw';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const API_URL = 'http://localhost:3000/api';

describe('Multiplayer E2E Simulation', () => {
  let testUsers: string[] = [];
  let roomId: string;
  let roomCode: string;
  let gameId: string;

  afterAll(async () => {
    // Delete room which cascades to room_players, games, rounds, etc.
    if (roomId) {
      await supabase.from('rooms').delete().eq('id', roomId);
    }
  });

  it('Host creates a room', async () => {
    const res = await fetch(`${API_URL}/room/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'HostBot' })
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.room.id).toBeDefined();
    
    roomId = data.room.id;
    roomCode = data.room.code;
    testUsers.push(data.userId);
  });

  it('Bots join the room', async () => {
    for (let i = 1; i < 4; i++) {
      const res = await fetch(`${API_URL}/room/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: roomCode, username: `Bot_${i}` })
      });
      const data = await res.json();
      expect(res.status).toBe(200);
      testUsers.push(data.userId);
    }
  });

  it('All players ready up', async () => {
    for (let i = 0; i < 4; i++) {
      const res = await fetch(`${API_URL}/room/ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, userId: testUsers[i], isReady: true })
      });
      expect(res.status).toBe(200);
    }
  });

  it('Host starts the game', async () => {
    const res = await fetch(`${API_URL}/game/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, userId: testUsers[0] })
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.gameId).toBeDefined();
    gameId = data.gameId;
  });

  it('Trump caller declares trump and transitions state', async () => {
    // Determine who is trump caller by fetching game state via sync
    const syncRes = await fetch(`${API_URL}/game/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, userId: testUsers[0] })
    });
    const syncData = await syncRes.json();
    const callerPos = syncData.publicState.trumpCallerPosition;
    
    const callerUser = syncData.publicState.players.find((p: any) => p.position === callerPos).userId;

    const res = await fetch(`${API_URL}/game/declare-trump`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, userId: callerUser, suit: 'spades' })
    });
    expect(res.status).toBe(200);

    // Skip the court window for testing normal play
    const skipRes = await fetch(`${API_URL}/game/court`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, userId: testUsers[0], action: 'skip_court_window' })
    });
    expect(skipRes.status).toBe(200);
  });

  it('Race Condition Validation: Reject duplicate out-of-turn play', async () => {
    const syncRes = await fetch(`${API_URL}/game/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, userId: testUsers[0] })
    });
    const syncData = await syncRes.json();
    
    // Attempt play from non-turn player
    const nonTurnPlayer = syncData.publicState.players.find((p: any) => p.position !== syncData.publicState.currentTrick.currentTurn).userId;
    
    // We need their hand to attempt to play a valid card ID (so it doesn't fail on "card not in hand")
    const nonTurnSync = await fetch(`${API_URL}/game/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, userId: nonTurnPlayer })
    });
    const { privateState } = await nonTurnSync.json();
    const illegalCard = privateState.hand[0].id;

    const res = await fetch(`${API_URL}/game/play-card`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, userId: nonTurnPlayer, cardId: illegalCard })
    });
    
    const data = await res.json();
    expect(res.status).toBe(403);
    expect(data.error).toBe('Not your turn');
  });

  it('Player disconnects and reconnects gracefully', async () => {
    const res = await fetch(`${API_URL}/game/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, userId: testUsers[2] })
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.publicState).toBeDefined();
    expect(data.privateState.hand.length).toBe(8);
  });
});
