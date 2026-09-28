-- Comfort Companion — extends mentor_profiles to match the full Mentor
-- shape the UI expects (src/lib/types.ts), which 0001_init.sql only
-- partially covered. Editable via the mentor profile editor screen.

alter table mentor_profiles
  add column if not exists tagline text not null default '',
  add column if not exists photos text[] not null default '{}',
  add column if not exists videos text[] not null default '{}',
  add column if not exists boundaries text[] not null default '{}',
  add column if not exists response_rate_pct int not null default 90,
  add column if not exists tier text not null default 'standard' check (tier in ('standard', 'top_rated')),
  add column if not exists popular boolean not null default false,
  add column if not exists rising boolean not null default false,
  add column if not exists age int,
  add column if not exists gender text,
  add column if not exists nationality text,
  add column if not exists born_city text,
  add column if not exists qualification text,
  add column if not exists college text,
  add column if not exists school text,
  add column if not exists religion text,
  add column if not exists communication_tags text[] not null default '{}',
  add column if not exists personality_tags text[] not null default '{}';
