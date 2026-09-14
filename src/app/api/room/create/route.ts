import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

function generateRoomCode(): string {
  return nanoid(6).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6).padEnd(6, 'A');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username } = body as { username: string };

    if (!username || username.trim().length < 2 || username.trim().length > 20) {
      return NextResponse.json(
        { error: 'Username must be 2–20 characters' },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    // ── 1. Create anonymous user ──────────────────────────────────────────
    // Use the base supabase-js client (not @supabase/ssr) with
    // persistSession:false so it works safely in a Node.js server context.
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
      console.error('[room/create] signInAnonymously error:', authError);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    const userId        = authData.user.id;
    const accessToken   = authData.session?.access_token  ?? null;
    const refreshToken  = authData.session?.refresh_token ?? null;

    // ── 2. Ensure profile exists ──────────────────────────────────────────
    // The handle_new_user trigger may have already created it;
    // upsert is safe either way.
    const { error: profileError } = await supabase.from('profiles').upsert({
      id:       userId,
      username: username.trim(),
    });
    if (profileError) {
      console.error('[room/create] profile upsert error:', profileError);
      // Non-fatal — continue; the trigger may have already created it
    }

    // ── 3. Generate unique room code ──────────────────────────────────────
    let code     = generateRoomCode();
    let attempts = 0;
    while (attempts < 10) {
      const { data: existing } = await supabase
        .from('rooms')
        .select('id')
        .eq('code', code)
        .single();
      if (!existing) break;
      code = generateRoomCode();
      attempts++;
    }

    // ── 4. Create room ────────────────────────────────────────────────────
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .insert({
        code,
        host_id:     userId,
        status:      'waiting',
        max_players: 4,
        expires_at:  expiresAt,
      })
      .select()
      .single();

    if (roomError || !room) {
      console.error('[room/create] room insert error:', roomError);
      return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
    }

    // ── 5. Add host as player ─────────────────────────────────────────────
    const { data: player, error: playerError } = await supabase
      .from('room_players')
      .insert({
        room_id:      room.id,
        user_id:      userId,
        position:     0,
        team:         0,
        is_ready:     false,
        is_connected: true,
        is_host:      true,
      })
      .select()
      .single();

    if (playerError || !player) {
      console.error('[room/create] room_player insert error:', playerError);
      return NextResponse.json({ error: 'Failed to add host to room' }, { status: 500 });
    }

    // ── 6. Return ─────────────────────────────────────────────────────────
    return NextResponse.json({
      room: {
        id:         room.id,
        code:       room.code,
        hostId:     room.host_id,
        status:     room.status,
        maxPlayers: room.max_players,
        createdAt:  room.created_at,
        expiresAt:  room.expires_at,
        players: [{
          id:          player.id,
          userId,
          username:    username.trim(),
          avatarUrl:   null,
          position:    player.position,
          team:        player.team,
          isReady:     player.is_ready,
          isConnected: player.is_connected,
          isHost:      player.is_host,
          joinedAt:    player.joined_at,
        }],
      },
      player: {
        id:          player.id,
        userId,
        username:    username.trim(),
        avatarUrl:   null,
        position:    player.position,
        team:        player.team,
        isReady:     player.is_ready,
        isConnected: player.is_connected,
        isHost:      player.is_host,
        joinedAt:    player.joined_at,
      },
      userId,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error('[room/create] unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
