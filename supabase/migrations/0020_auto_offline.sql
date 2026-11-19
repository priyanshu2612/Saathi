-- Saathis who stop sending their 30-second heartbeat (closed the app, lost
-- signal, phone died) are taken offline automatically, so Seekers don't see
-- or call someone who has left. Runs every minute.

create extension if not exists pg_cron;

create or replace function mark_stale_saathis_offline() returns void
language sql
security definer
set search_path = public
as $$
  update mentor_profiles mp
  set is_online = false
  where mp.is_online
    and exists (select 1 from mentor_online_time t where t.mentor_id = mp.user_id)
    and (select max(t.last_beat) from mentor_online_time t where t.mentor_id = mp.user_id)
        < now() - interval '2 minutes';
$$;

select cron.unschedule('saathi-auto-offline')
where exists (select 1 from cron.job where jobname = 'saathi-auto-offline');
select cron.schedule('saathi-auto-offline', '* * * * *', 'select mark_stale_saathis_offline()');
