-- ═══════════════════════════════════════════════════════════════════
-- Sri Lankan Omi — Row Level Security Policies
-- Migration 002
-- ═══════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table rooms enable row level security;
alter table room_players enable row level security;
alter table games enable row level security;
alter table tricks enable row level security;
alter table rounds enable row level security;

-- ─── profiles ──────────────────────────────────────────────────────

-- Anyone can read profiles (for displaying usernames)
create policy "profiles_select_all"
  on profiles for select using (true);

-- Users can only update their own profile
create policy "profiles_update_own"
  on profiles for update using (auth.uid() = id);

-- ─── rooms ─────────────────────────────────────────────────────────

-- Players in a room can read that room
create policy "rooms_select_member"
  on rooms for select using (
    exists (
      select 1 from room_players rp
      where rp.room_id = rooms.id
        and rp.user_id = auth.uid()
    )
  );

-- Any authenticated user can read a room by code (to join)
create policy "rooms_select_by_code"
  on rooms for select using (status = 'waiting');

-- Room creation handled by API (service role) — no direct insert
-- Games, tricks, rounds are managed by server (service role only)

-- ─── room_players ──────────────────────────────────────────────────

-- Room members can see other members
create policy "room_players_select_room_members"
  on room_players for select using (
    exists (
      select 1 from room_players rp2
      where rp2.room_id = room_players.room_id
        and rp2.user_id = auth.uid()
    )
  );

-- ─── games ─────────────────────────────────────────────────────────

-- Game state (minus hands/deck) is readable by room members
-- NOTE: The API strips hands/deck_state before returning to clients
create policy "games_select_room_members"
  on games for select using (
    exists (
      select 1 from room_players rp
      where rp.room_id = games.room_id
        and rp.user_id = auth.uid()
    )
  );

-- ─── tricks ────────────────────────────────────────────────────────

create policy "tricks_select_game_members"
  on tricks for select using (
    exists (
      select 1 from games g
      join room_players rp on rp.room_id = g.room_id
      where g.id = tricks.game_id
        and rp.user_id = auth.uid()
    )
  );

-- ─── rounds ────────────────────────────────────────────────────────

create policy "rounds_select_game_members"
  on rounds for select using (
    exists (
      select 1 from games g
      join room_players rp on rp.room_id = g.room_id
      where g.id = rounds.game_id
        and rp.user_id = auth.uid()
    )
  );
