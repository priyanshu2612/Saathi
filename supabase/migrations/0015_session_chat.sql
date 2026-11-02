-- In-call chat between a seeker and a Saathi. Written/read only by the
-- session_chat edge function (service role).
create table if not exists session_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions (id) on delete cascade,
  sender_id uuid not null references profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists session_messages_session_idx on session_messages (session_id, created_at);

alter table session_messages enable row level security;
