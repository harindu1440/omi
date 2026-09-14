-- ═══════════════════════════════════════════════════════════════════
-- Sri Lankan Omi — Initial Database Schema
-- Migration 001
-- ═══════════════════════════════════════════════════════════════════

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Enums ─────────────────────────────────────────────────────────

create type room_status as enum ('waiting', 'playing', 'finished');

create type game_phase as enum (
  'waiting',
  'dealing_first',
  'trump_selection',
  'dealing_rest',
  'court_window',
  'half_court_pending',
  'full_court_pending',
  'full_court_decide',
  'playing',
  'half_court_playing',
  'full_court_playing',
  'round_end',
  'match_end'
);

create type court_type as enum ('none', 'half', 'full');

create type suit_type as enum ('spades', 'hearts', 'diamonds', 'clubs');

-- ─── profiles ──────────────────────────────────────────────────────

create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text not null,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── rooms ─────────────────────────────────────────────────────────

create table if not exists rooms (
  id          uuid primary key default uuid_generate_v4(),
  code        char(6) not null unique,
  host_id     uuid not null references profiles(id),
  status      room_status not null default 'waiting',
  max_players int not null default 4,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '2 hours')
);

create index idx_rooms_code on rooms(code);
create index idx_rooms_status on rooms(status);

-- ─── room_players ──────────────────────────────────────────────────

create table if not exists room_players (
  id           uuid primary key default uuid_generate_v4(),
  room_id      uuid not null references rooms(id) on delete cascade,
  user_id      uuid not null references profiles(id),
  position     int not null check (position between 0 and 3),
  team         int not null check (team in (0, 1)),
  is_ready     boolean not null default false,
  is_connected boolean not null default true,
  is_host      boolean not null default false,
  joined_at    timestamptz not null default now(),
  unique (room_id, position),
  unique (room_id, user_id)
);

create index idx_room_players_room on room_players(room_id);
create index idx_room_players_user on room_players(user_id);

-- ─── games ─────────────────────────────────────────────────────────

create table if not exists games (
  id                        uuid primary key default uuid_generate_v4(),
  room_id                   uuid not null references rooms(id),
  phase                     game_phase not null default 'waiting',
  round_number              int not null default 1,
  dealer_position           int not null default 0,
  trump_caller_position     int,
  trump_suit                suit_type,
  katakola_team0            int not null default 10,
  katakola_team1            int not null default 10,
  katakola_bonus_pool       int not null default 0,
  current_trick_number      int not null default 0,
  tricks_team0              int not null default 0,
  tricks_team1              int not null default 0,
  kapothi_announced         boolean not null default false,
  kapothi_eligible          boolean not null default false,
  court_type                court_type not null default 'none',
  court_requester_position  int,
  court_trump_suit          suit_type,
  inactive_player_position  int,
  card_exchange_phase       text,                -- 'requesting' | 'partner_choosing' | 'requester_deciding' | 'done' | null
  requested_card_ids        text[],              -- for full court exchange
  given_cards               jsonb,              -- cards given by partner
  returned_card_ids         text[],             -- cards returned by requester
  -- SERVER-ONLY: encrypted deck state
  deck_state                jsonb not null default '[]',
  -- SERVER-ONLY: player hands (never sent to clients)
  hands                     jsonb not null default '{}',
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index idx_games_room on games(room_id);

-- ─── tricks ────────────────────────────────────────────────────────

create table if not exists tricks (
  id               uuid primary key default uuid_generate_v4(),
  game_id          uuid not null references games(id) on delete cascade,
  trick_number     int not null,
  led_suit         suit_type,
  cards_played     jsonb not null default '[]',  -- [{position, card}]
  winner_position  int,
  winner_team      int,
  completed_at     timestamptz not null default now(),
  unique (game_id, trick_number)
);

create index idx_tricks_game on tricks(game_id);

-- ─── rounds ────────────────────────────────────────────────────────

create table if not exists rounds (
  id                uuid primary key default uuid_generate_v4(),
  game_id           uuid not null references games(id) on delete cascade,
  round_number      int not null,
  trump_suit        suit_type,
  tricks_team0      int not null default 0,
  tricks_team1      int not null default 0,
  katakola_change   int not null default 0,
  winning_team      int,
  losing_team       int,
  outcome           text,
  court_type        court_type not null default 'none',
  katakola_before   jsonb,
  katakola_after    jsonb,
  completed_at      timestamptz not null default now(),
  unique (game_id, round_number)
);

create index idx_rounds_game on rounds(game_id);

-- ─── Updated at trigger ────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger games_updated_at
  before update on games
  for each row execute function set_updated_at();

-- ─── Auto-create profile on sign-up ──────────────────────────────

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'Player_' || substr(new.id::text, 1, 6))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
