-- The Saathi application form was shortened (form version 2): city, topics
-- and the separate "About you" step are gone (profession is still asked, on the
-- first step). Existing applications keep all their data; new ones just leave
-- the removed columns empty.

-- Tag funnel events with the form version so old (v1) and new (v2) step
-- numbers aren't mixed. Existing events are v1.
alter table saathi_funnel_events add column if not exists form_version int not null default 1;
create index if not exists saathi_funnel_events_version_idx
  on saathi_funnel_events (form_version, step, visitor_id);

-- Funnel report per form version. Run:  select * from saathi_funnel;
-- (add `where form_version = 2` for just the current form)
create or replace view saathi_funnel as
with reached as (
  select form_version, step, count(distinct visitor_id) as visitors
  from saathi_funnel_events
  group by form_version, step
),
labels (form_version, step, label) as (
  values
    (1, 0, 'Intro'),
    (1, 1, 'About you (name, age, city)'),
    (1, 2, 'How can we reach you'),
    (1, 3, 'Languages'),
    (1, 4, 'About you (background)'),
    (1, 5, 'Your availability'),
    (1, 6, 'Add your photos'),
    (1, 7, 'Before you submit'),
    (1, 8, 'Submitted'),
    (2, 0, 'Intro'),
    (2, 1, 'Name, age, profession, phone'),
    (2, 2, 'Languages'),
    (2, 3, 'Your availability'),
    (2, 4, 'Add your photo'),
    (2, 5, 'Before you submit'),
    (2, 6, 'Submitted')
)
select
  l.form_version,
  l.step,
  l.label,
  coalesce(r.visitors, 0) as visitors,
  round(
    100.0 * coalesce(r.visitors, 0)
    / nullif(max(r.visitors) filter (where l.step = 0) over (partition by l.form_version), 0),
    1
  ) as pct_of_start,
  case when l.step = 0 then null
       else coalesce(lag(r.visitors) over (partition by l.form_version order by l.step), 0)
            - coalesce(r.visitors, 0) end as lost_from_previous
from labels l
left join reached r using (form_version, step)
order by l.form_version, l.step;

-- Only the dashboard / service role may read the report.
alter view saathi_funnel set (security_invoker = true);
