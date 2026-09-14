import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, username } = body as { code: string; username: string };

    if (!code || code.trim().length !== 6) {
      return NextResponse.json({ error: 'Invalid room code' }, { status: 400 });
    }
    if (!username || username.trim().length < 2 || username.trim().length > 20) {
      return NextResponse.json(
        { error: 'Username must be 2–20 characters' },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();
    const roomCode = code.trim().toUpperCase();

    // Find the room
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*, room_players(*)')
      .eq('code', roomCode)
      .eq('status', 'waiting')
      .single();

    if (roomError || !room) {
      return NextResponse.json(
        { error: 'Room not found or game already started' },
        { status: 404 },
      );
    }

    // Check room isn't full
    const existingPlayers = room.room_players as any[];
    if (existingPlayers.length >= room.max_players) {
      return NextResponse.json({ error: 'Room is full' }, { status: 409 });
    }

    // Check expiry
    if (new Date(room.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Room has expired' }, { status: 410 });
    }

    // Create anonymous user using the anon key + signInAnonymously.
    // We use the base supabase-js client (NOT the SSR client) with
    // persistSession:false so it works safely in a server/Node context.
    const anonSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    const { data: authData, error: authError } = await anonSupabase.auth.signInAnonymously({
      options: { data: { username: username.trim() } },
    });

    if (authError || !authData.user) {
      console.error('[room/join] signInAnonymously error:', authError);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    const userId       = authData.user.id;
    const accessToken  = authData.session?.access_token  ?? null;
    const refreshToken = authData.session?.refresh_token ?? null;

    // Ensure profile
    await supabase.from('profiles').upsert({
      id: userId,
      username: username.trim(),
    });

    // Find next available position
    const takenPositions = existingPlayers.map((p: any) => p.position as number);
    const allPositions = [0, 1, 2, 3];
    const availablePosition = allPositions.find((p) => !takenPositions.includes(p));

    if (availablePosition === undefined) {
      return NextResponse.json({ error: 'Room is full' }, { status: 409 });
    }

    // Assign team: positions 0,2 = team 0; positions 1,3 = team 1
    const team = availablePosition % 2;

    // Add player
    const { data: player, error: playerError } = await supabase
      .from('room_players')
      .insert({
        room_id: room.id,
        user_id: userId,
        position: availablePosition,
        team,
        is_ready: false,
        is_connected: true,
        is_host: false,
      })
      .select()
      .single();

    if (playerError || !player) {
      return NextResponse.json({ error: 'Failed to join room' }, { status: 500 });
    }

    // Fetch all players with profiles
    const { data: allPlayers } = await supabase
      .from('room_players')
      .select('*, profiles(username, avatar_url)')
      .eq('room_id', room.id);

    const formattedPlayers = (allPlayers ?? []).map((p: any) => ({
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

    return NextResponse.json({
      room: {
        id: room.id,
        code: room.code,
        hostId: room.host_id,
        status: room.status,
        players: formattedPlayers,
        maxPlayers: room.max_players,
        createdAt: room.created_at,
        expiresAt: room.expires_at,
      },
      player: {
        id: player.id,
        userId,
        username: username.trim(),
        avatarUrl: null,
        position: player.position,
        team: player.team,
        isReady: player.is_ready,
        isConnected: player.is_connected,
        isHost: player.is_host,
        joinedAt: player.joined_at,
      },
      userId,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error('[room/join]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
