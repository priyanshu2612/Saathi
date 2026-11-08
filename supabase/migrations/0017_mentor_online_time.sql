-- Daily online time per Saathi, driving the "stay online 2 hours" target,
-- the leaderboard and the dashboard. Written only by the `mentor_stats`
-- edge function (service role) from a heartbeat sent while the Saathi is
-- online; no client policies.
create table if not exists mentor_online_time (
  mentor_id uuid not null references profiles (id) on delete cascade,
  day date not null, -- India (IST) calendar day
  seconds int not null default 0,
  last_beat timestamptz not null default now(),
  primary key (mentor_id, day)
);

alter table mentor_online_time enable row level security;

create index if not exists mentor_online_time_day_idx on mentor_online_time (day, seconds desc);

-- Dashboard queries filter a mentor's sessions by started_at.
create index if not exists sessions_mentor_started_idx on sessions (mentor_id, started_at);
