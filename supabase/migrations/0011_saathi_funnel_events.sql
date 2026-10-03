-- Anonymous step-by-step tracking of the Saathi application form, so we can
-- see where applicants drop off. No personal details are stored — just a
-- random per-browser visitor id, the step reached and a timestamp.
-- Written only by the `track_funnel` edge function (service role).

create table if not exists saathi_funnel_events (
  id bigint generated always as identity primary key,
  visitor_id text not null check (char_length(visitor_id) between 8 and 64),
  step int not null check (step between 0 and 8),
  created_at timestamptz not null default now()
);

create index if not exists saathi_funnel_events_step_idx on saathi_funnel_events (step, visitor_id);

alter table saathi_funnel_events enable row level security;
-- No client policies: service role only.

-- Funnel report. Run in the Supabase SQL editor:  select * from saathi_funnel;
-- `visitors` = distinct people who reached the step; `pct_of_start` is relative to
-- the intro screen; `lost_from_previous` is who dropped between this step and the one before.
create or replace view saathi_funnel as
with reached as (
  select step, count(distinct visitor_id) as visitors
  from saathi_funnel_events
  group by step
),
labelled as (
  select * from (values
    (0, 'Intro'),
    (1, 'About you (name, age, city)'),
    (2, 'How can we reach you'),
    (3, 'Languages'),
    (4, 'About you (background)'),
    (5, 'Your availability'),
    (6, 'Add your photos'),
    (7, 'Before you submit'),
    (8, 'Submitted')
  ) as t(step, label)
)
select
  l.step,
  l.label,
  coalesce(r.visitors, 0) as visitors,
  round(100.0 * coalesce(r.visitors, 0) / nullif(max(r.visitors) filter (where l.step = 0) over (), 0), 1) as pct_of_start,
  case when l.step = 0 then null
       else coalesce(lag(r.visitors) over (order by l.step), 0) - coalesce(r.visitors, 0) end as lost_from_previous
from labelled l
left join reached r using (step)
order by l.step;
