-- Seeker accounts (phone + 4-digit PIN) and live-call plumbing.

-- ---------------------------------------------------------------------------
-- seeker_accounts: phone + PIN credentials for a seeker profile.
-- Service-role only (edge function `seeker_auth`); no client policies.
-- The PIN is stored as a salted PBKDF2 hash, never in plaintext.
-- ---------------------------------------------------------------------------
create table if not exists seeker_accounts (
  user_id uuid primary key references profiles (id) on delete cascade,
  phone text not null unique check (phone ~ '^[0-9]{10}$'),
  pin_hash text not null,
  pin_salt text not null,
  username text not null unique,
  age int check (age between 13 and 120),
  failed_attempts int not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now()
);

alter table seeker_accounts enable row level security;

-- ---------------------------------------------------------------------------
-- sessions: ringing state + the topic the seeker picked while waiting.
-- A video call starts as 'ringing'; the Saathi accepting flips it to
-- 'active' and resets started_at so billing only counts connected time.
-- ---------------------------------------------------------------------------
alter table sessions drop constraint if exists sessions_status_check;
alter table sessions add constraint sessions_status_check
  check (status in ('ringing', 'active', 'completed', 'disputed', 'declined', 'missed', 'cancelled'));

alter table sessions add column if not exists topic_category text
  check (topic_category in ('social', 'dating', 'life'));
alter table sessions add column if not exists topic text;

create index if not exists sessions_mentor_status_idx on sessions (mentor_id, status);
