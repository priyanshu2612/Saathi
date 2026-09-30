-- Saathi (mentor) application intake — replaces the Meta-ads Google Form.
-- Seekers land on /welcome, tap "Join as a Saathi", and either sign in with
-- an existing access code (mentor_invites) or apply fresh here. Applications
-- are reviewed manually; an admin later creates a mentor_invites row (with
-- an access code) for anyone shortlisted.

-- ---------------------------------------------------------------------------
-- mentor_invites: let an admin optionally pin an invite to a specific phone
-- number, so the sign-in step can check phone + code together, not code alone.
-- ---------------------------------------------------------------------------
alter table mentor_invites add column if not exists phone text;

-- ---------------------------------------------------------------------------
-- saathi_applications: one row per submitted application.
-- ---------------------------------------------------------------------------
create table if not exists saathi_applications (
  id uuid primary key default gen_random_uuid(),

  full_name text not null,
  display_name text not null,
  age int not null check (age >= 18),
  city_state text not null,
  phone text not null,
  whatsapp_number text not null,
  email text not null,

  languages text[] not null default '{}',
  languages_other text,

  background text not null,
  background_other text,
  experience_range text not null,
  qualifications text,

  topics text[] not null default '{}',
  topics_other text,
  topics_avoid text,
  bio text not null,
  social_link text,

  modes text[] not null default '{}',
  hours_per_week text not null,
  availability_times text[] not null default '{}',
  quiet_space text not null,
  heard_about text,

  photo_paths text[] not null default '{}',

  confirmed_age_and_true boolean not null default false,
  confirmed_id_check boolean not null default false,
  confirmed_conduct_review boolean not null default false,
  confirmed_contact_consent boolean not null default false,

  status text not null default 'pending' check (status in ('pending', 'shortlisted', 'rejected')),
  created_at timestamptz not null default now()
);

alter table saathi_applications enable row level security;

-- No client policies at all: only the submit_saathi_application edge
-- function (service role) may read or write this table. Admin review
-- happens in the Supabase dashboard / SQL editor.

create index if not exists saathi_applications_phone_idx on saathi_applications (phone);
create index if not exists saathi_applications_status_idx on saathi_applications (status);

-- ---------------------------------------------------------------------------
-- storage: private bucket for applicant photos, uploaded server-side by
-- submit_saathi_application (service role). No client storage policies —
-- nothing reads or writes this bucket except that function and the admin
-- dashboard.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('saathi-photos', 'saathi-photos', false)
on conflict (id) do nothing;
