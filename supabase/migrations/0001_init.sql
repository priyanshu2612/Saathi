-- Comfort Companion — core schema (PRD Section 10.1 + Design System Section 8)
-- Run via: supabase db push  (or paste into the Supabase SQL editor)

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- profiles: one row per authenticated user (seeker or mentor)
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('seeker', 'mentor')),
  display_name text not null,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles: read own" on profiles
  for select using (auth.uid() = id);

create policy "profiles: insert own" on profiles
  for insert with check (auth.uid() = id);

create policy "profiles: update own" on profiles
  for update using (auth.uid() = id);

-- Seekers need to see a mentor's display name when browsing; expose a
-- read-only view instead of opening the base table to everyone.
create policy "profiles: mentors are publicly readable" on profiles
  for select using (role = 'mentor');

-- ---------------------------------------------------------------------------
-- mentor_profiles: application + public profile data
-- ---------------------------------------------------------------------------
create table if not exists mentor_profiles (
  user_id uuid primary key references profiles (id) on delete cascade,
  bio text not null default '',
  tags text[] not null default '{}',
  languages text[] not null default '{}',
  rate_chat int not null default 8 check (rate_chat between 5 and 15),
  rate_audio int,
  rate_video int,
  photo_url text,
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'approved', 'rejected')),
  id_document_url text,
  is_online boolean not null default false,
  rating numeric(3, 2) not null default 0,
  session_count int not null default 0,
  created_at timestamptz not null default now()
);

alter table mentor_profiles enable row level security;

create policy "mentor_profiles: public read of approved mentors" on mentor_profiles
  for select using (verification_status = 'approved');

create policy "mentor_profiles: mentor reads own row regardless of status" on mentor_profiles
  for select using (auth.uid() = user_id);

create policy "mentor_profiles: mentor updates own editable fields" on mentor_profiles
  for update using (auth.uid() = user_id);

create policy "mentor_profiles: mentor inserts own row" on mentor_profiles
  for insert with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- wallets + coin_transactions: the ledger is the source of truth.
-- coin_balance is a cached read of the ledger sum, written ONLY by
-- server-side functions (never directly by client code).
-- ---------------------------------------------------------------------------
create table if not exists wallets (
  user_id uuid primary key references profiles (id) on delete cascade,
  coin_balance int not null default 0,
  updated_at timestamptz not null default now()
);

alter table wallets enable row level security;

create policy "wallets: read own" on wallets
  for select using (auth.uid() = user_id);

-- Deliberately no insert/update/delete policy for authenticated clients.
-- All writes happen through SECURITY DEFINER functions / edge functions
-- using the service role, which bypasses RLS entirely.

create table if not exists coin_transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles (id) on delete cascade,
  amount int not null,
  type text not null check (
    type in ('purchase', 'session_spend', 'session_earning', 'refund', 'free_credit')
  ),
  related_session_id uuid,
  created_at timestamptz not null default now()
);

alter table coin_transactions enable row level security;

create policy "coin_transactions: read own" on coin_transactions
  for select using (auth.uid() = user_id);

-- No client insert/update/delete policy — ledger is server-only.

-- ---------------------------------------------------------------------------
-- sessions
-- ---------------------------------------------------------------------------
create table if not exists sessions (
  id uuid primary key default uuid_generate_v4(),
  seeker_id uuid not null references profiles (id) on delete cascade,
  mentor_id uuid not null references profiles (id) on delete cascade,
  mode text not null default 'chat' check (mode in ('chat', 'audio', 'video')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  total_coins_charged int not null default 0,
  status text not null default 'active' check (status in ('active', 'completed', 'disputed')),
  rate_per_minute int not null
);

alter table sessions enable row level security;

create policy "sessions: participants can read" on sessions
  for select using (auth.uid() = seeker_id or auth.uid() = mentor_id);

-- Sessions are created/updated only via edge functions (service role).

-- ---------------------------------------------------------------------------
-- ratings
-- ---------------------------------------------------------------------------
create table if not exists ratings (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references sessions (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  tag text,
  comment text,
  created_at timestamptz not null default now()
);

alter table ratings enable row level security;

create policy "ratings: seeker can insert for their own session" on ratings
  for insert with check (
    exists (
      select 1 from sessions
      where sessions.id = session_id and sessions.seeker_id = auth.uid()
    )
  );

create policy "ratings: participants can read" on ratings
  for select using (
    exists (
      select 1 from sessions
      where sessions.id = session_id
        and (sessions.seeker_id = auth.uid() or sessions.mentor_id = auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- reports
-- ---------------------------------------------------------------------------
create table if not exists reports (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references sessions (id) on delete cascade,
  reporter_id uuid not null references profiles (id) on delete cascade,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved')),
  created_at timestamptz not null default now()
);

alter table reports enable row level security;

create policy "reports: reporter can insert" on reports
  for insert with check (auth.uid() = reporter_id);

create policy "reports: reporter can read own" on reports
  for select using (auth.uid() = reporter_id);

-- ---------------------------------------------------------------------------
-- mentor_invites: bridge between the Meta-ads application form and the app
-- (Design System Section 8). Rows are inserted manually by an admin after
-- reviewing an applicant; nothing here is client-writable.
-- ---------------------------------------------------------------------------
create table if not exists mentor_invites (
  id uuid primary key default uuid_generate_v4(),
  access_code text not null unique,
  prefill_name text,
  prefill_photos text[] default '{}',
  prefill_bio text,
  prefill_tags text[] default '{}',
  prefill_languages text[] default '{}',
  status text not null default 'unclaimed' check (status in ('unclaimed', 'claimed', 'expired')),
  claimed_by_user_id uuid references profiles (id),
  created_at timestamptz not null default now()
);

alter table mentor_invites enable row level security;

-- No client policies at all: only the claim_mentor_invite edge function
-- (service role) may read or write this table.

create index if not exists mentor_invites_access_code_idx on mentor_invites (access_code);
