import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, userId } = body as { roomId: string; userId: string };

    if (!roomId || !userId) {
      return NextResponse.json({ error: 'Missing roomId or userId' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Find the player
    const { data: player, error } = await supabase
      .from('room_players')
      .select('*')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .single();

    if (error || !player) {
      return NextResponse.json({ error: 'Player not in room' }, { status: 404 });
    }

    // Toggle ready
    const newReady = !player.is_ready;
    const { data: updated, error: updateError } = await supabase
      .from('room_players')
      .update({ is_ready: newReady })
      .eq('id', player.id)
      .select()
      .single();

    if (updateError || !updated) {
      return NextResponse.json({ error: 'Failed to update ready state' }, { status: 500 });
    }

    // Check if all players are ready
    const { data: allPlayers } = await supabase
      .from('room_players')
      .select('is_ready')
      .eq('room_id', roomId);

    const allReady =
      (allPlayers?.length ?? 0) === 4 &&
      (allPlayers ?? []).every((p: any) => p.is_ready);

    return NextResponse.json({
      player: {
        id: updated.id,
        userId: updated.user_id,
        position: updated.position,
        team: updated.team,
        isReady: updated.is_ready,
        isConnected: updated.is_connected,
        isHost: updated.is_host,
        joinedAt: updated.joined_at,
      },
      allReady,
    });
  } catch (err) {
    console.error('[room/ready]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
