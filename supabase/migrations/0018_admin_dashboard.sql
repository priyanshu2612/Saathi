-- Admin dashboard: one read-only aggregate function, callable ONLY with the
-- service-role key (i.e. from the Next.js /api/admin/stats route after the
-- admin password check). It is never exposed to anon/authenticated clients.
--
-- Conventions
--   * "Day" always means an India (IST) calendar day.
--   * Connected session = status active/completed (a call that was answered).
--     Talk time = ended_at - started_at (started_at is reset on accept),
--     capped at 3h per session so a never-closed tab can't inflate it.
--   * Active seeker = requested a conversation or bought coins in the window.
--   * Active Saathi = sent online heartbeats or took a call in the window.
--   * Revenue (INR) is derived from the coins in each 'purchase' row using
--     the pack table; unknown pack sizes fall back to 1 coin = Rs 1.

create or replace function admin_pack_inr(p_coins int)
returns int
language sql
immutable
as $$
  select case p_coins
    when 250 then 249
    when 550 then 499
    when 1150 then 999
    when 3000 then 2499
    else p_coins
  end;
$$;

create or replace function admin_dashboard(p_days int default 30)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_days int := greatest(1, least(coalesce(p_days, 30), 365));
  v_today date := (now() at time zone 'Asia/Kolkata')::date;
  v_from date := (now() at time zone 'Asia/Kolkata')::date
                 - (greatest(1, least(coalesce(p_days, 30), 365)) - 1);
  v_today_ts timestamptz := ((now() at time zone 'Asia/Kolkata')::date)::timestamp at time zone 'Asia/Kolkata';
  v_from_ts timestamptz := (((now() at time zone 'Asia/Kolkata')::date
                 - (greatest(1, least(coalesce(p_days, 30), 365)) - 1))::timestamp) at time zone 'Asia/Kolkata';
  result jsonb;
begin
  with
  sx as (
    select s.id, s.seeker_id, s.mentor_id, s.mode, s.status, s.started_at, s.ended_at,
           s.total_coins_charged as coins, s.topic_category,
           (s.started_at at time zone 'Asia/Kolkata')::date as d,
           (s.status in ('active', 'completed')) as connected,
           case when s.status in ('active', 'completed')
                then least(extract(epoch from (coalesce(s.ended_at, now()) - s.started_at)), 10800)::int
                else 0 end as secs
    from sessions s
  ),
  rng as (select * from sx where started_at >= v_from_ts),
  tdy as (select * from sx where started_at >= v_today_ts),
  pur as (
    select ct.user_id, ct.amount as coins, ct.created_at,
           admin_pack_inr(ct.amount) as inr,
           (ct.created_at at time zone 'Asia/Kolkata')::date as d
    from coin_transactions ct
    where ct.type = 'purchase'
  ),
  seekers as (
    select p.id, p.display_name, p.created_at,
           sa.username, sa.phone, sa.age,
           (p.created_at at time zone 'Asia/Kolkata')::date as d
    from profiles p
    left join seeker_accounts sa on sa.user_id = p.id
    where p.role = 'seeker'
  ),
  per_seeker as (
    select se.id, se.created_at, se.d,
           count(x.id) as requests,
           count(x.id) filter (where x.connected) as talks,
           coalesce(sum(x.secs), 0) as secs
    from seekers se
    left join sx x on x.seeker_id = se.id
    group by se.id, se.created_at, se.d
  ),
  per_payer as (
    select user_id, count(*) as buys, sum(inr) as inr
    from pur group by user_id
  ),
  act_s_tdy as (
    select seeker_id as uid from tdy
    union
    select user_id from pur where created_at >= v_today_ts
  ),
  act_s_rng as (
    select seeker_id as uid from rng
    union
    select user_id from pur where created_at >= v_from_ts
  ),
  act_m_tdy as (
    select mentor_id as uid from mentor_online_time where day = v_today and seconds > 0
    union
    select mentor_id from tdy where connected
  ),
  act_m_rng as (
    select mentor_id as uid from mentor_online_time where day >= v_from and seconds > 0
    union
    select mentor_id from rng where connected
  ),
  mentors as (
    select mp.user_id, p.display_name, mp.verification_status, mp.is_online, mp.rating,
           mp.created_at
    from mentor_profiles mp
    join profiles p on p.id = mp.user_id
  ),
  days as (
    select generate_series(v_from, v_today, interval '1 day')::date as d
  ),
  daily as (
    select dy.d,
      (select count(*) from seekers s where s.d = dy.d) as new_seekers,
      (select count(*) from (
          select x.seeker_id from sx x where x.d = dy.d
          union
          select p.user_id from pur p where p.d = dy.d) q) as active_seekers,
      (select count(distinct m.mentor_id) from mentor_online_time m
        where m.day = dy.d and m.seconds > 0) as active_saathi,
      (select count(*) from sx x where x.d = dy.d and x.connected) as sessions,
      (select round(coalesce(sum(x.secs), 0) / 60.0, 1) from sx x where x.d = dy.d) as talk_minutes,
      (select count(*) from sx x where x.d = dy.d and x.status in ('missed', 'declined', 'cancelled')) as unanswered,
      (select coalesce(sum(p.inr), 0) from pur p where p.d = dy.d) as revenue,
      (select count(*) from pur p where p.d = dy.d) as purchases
    from days dy
    order by dy.d
  ),
  hours as (
    select h,
           count(x.id) as requests,
           count(x.id) filter (where x.connected) as connected
    from generate_series(0, 23) h
    left join rng x on extract(hour from x.started_at at time zone 'Asia/Kolkata')::int = h
    group by h
    order by h
  ),
  cohorts as (
    select date_trunc('week', ps.d::timestamp)::date as week,
           count(*) as joined,
           count(*) filter (where ps.talks >= 1) as talked,
           count(*) filter (where ps.talks >= 2) as repeated,
           count(*) filter (where exists (select 1 from pur p where p.user_id = ps.id)) as paid
    from per_seeker ps
    where ps.d >= v_today - 55
    group by 1
    order by 1
  ),
  rating_rng as (
    select r.rating, r.created_at, s.mentor_id
    from ratings r join sessions s on s.id = r.session_id
    where r.created_at >= v_from_ts
  )
  select jsonb_build_object(
    'generated_at', now(),
    'today', v_today,
    'range_days', v_days,
    'range_from', v_from,

    'live', jsonb_build_object(
      'in_call', (select count(*) from sx where status = 'active'),
      'ringing', (select count(*) from sx where status = 'ringing' and started_at > now() - interval '2 minutes'),
      'saathi_online', (select count(*) from mentors where is_online and verification_status = 'approved')
    ),

    'users', jsonb_build_object(
      'total', (select count(*) from seekers),
      'new_today', (select count(*) from seekers where d = v_today),
      'new_yesterday', (select count(*) from seekers where d = v_today - 1),
      'new_range', (select count(*) from seekers where d >= v_from),
      'active_today', (select count(*) from act_s_tdy),
      'active_range', (select count(*) from act_s_rng),
      'dau', (select count(*) from act_s_tdy),
      'wau', (select count(*) from (
                select seeker_id from sx where started_at >= now() - interval '7 days'
                union select user_id from pur where created_at >= now() - interval '7 days') q),
      'mau', (select count(*) from (
                select seeker_id from sx where started_at >= now() - interval '30 days'
                union select user_id from pur where created_at >= now() - interval '30 days') q),
      'avg_age', (select round(avg(age), 1) from seekers where age is not null)
    ),

    'engagement', jsonb_build_object(
      'requested_ever', (select count(*) from per_seeker where requests >= 1),
      'talked_ever', (select count(*) from per_seeker where talks >= 1),
      'never_talked', (select count(*) from per_seeker where talks = 0),
      'one_time', (select count(*) from per_seeker where talks = 1),
      'repeat', (select count(*) from per_seeker where talks >= 2),
      'power', (select count(*) from per_seeker where talks >= 5),
      'avg_sessions_per_talker', (select round(avg(talks), 2) from per_seeker where talks >= 1),
      'avg_minutes_per_talker', (select round(avg(secs) / 60.0, 1) from per_seeker where talks >= 1),
      'buckets', jsonb_build_array(
        jsonb_build_object('label', 'Never talked', 'count', (select count(*) from per_seeker where talks = 0)),
        jsonb_build_object('label', '1 session', 'count', (select count(*) from per_seeker where talks = 1)),
        jsonb_build_object('label', '2-3', 'count', (select count(*) from per_seeker where talks between 2 and 3)),
        jsonb_build_object('label', '4-9', 'count', (select count(*) from per_seeker where talks between 4 and 9)),
        jsonb_build_object('label', '10+', 'count', (select count(*) from per_seeker where talks >= 10))
      )
    ),

    'funnel', jsonb_build_array(
      jsonb_build_object('label', 'Signed up', 'count', (select count(*) from seekers)),
      jsonb_build_object('label', 'Requested a call/chat', 'count', (select count(*) from per_seeker where requests >= 1)),
      jsonb_build_object('label', 'Got connected', 'count', (select count(*) from per_seeker where talks >= 1)),
      jsonb_build_object('label', 'Bought coins', 'count', (select count(*) from per_payer)),
      jsonb_build_object('label', 'Bought again', 'count', (select count(*) from per_payer where buys >= 2))
    ),

    'talk', jsonb_build_object(
      'minutes_today', (select round(coalesce(sum(secs), 0) / 60.0, 1) from tdy),
      'minutes_range', (select round(coalesce(sum(secs), 0) / 60.0, 1) from rng),
      'minutes_all', (select round(coalesce(sum(secs), 0) / 60.0, 1) from sx),
      'sessions_today', (select count(*) from tdy where connected),
      'sessions_range', (select count(*) from rng where connected),
      'sessions_all', (select count(*) from sx where connected),
      'requests_range', (select count(*) from rng),
      'avg_seconds', (select round(avg(secs)) from rng where connected),
      'median_seconds', (select round((percentile_cont(0.5) within group (order by secs))::numeric) from rng where connected),
      'longest_seconds', (select max(secs) from rng where connected),
      'connect_rate', (select round(100.0 * count(*) filter (where connected) / nullif(count(*), 0), 1) from rng)
    ),

    'by_mode', (select coalesce(jsonb_agg(to_jsonb(t) order by t.minutes desc), '[]'::jsonb) from (
      select mode,
             count(*) as sessions,
             round(coalesce(sum(secs), 0) / 60.0, 1) as minutes,
             round(avg(secs)) as avg_seconds,
             coalesce(sum(coins), 0) as coins
      from rng where connected group by mode) t),

    'outcomes', (select coalesce(jsonb_agg(to_jsonb(t) order by t.count desc), '[]'::jsonb) from (
      select status, count(*) as count from rng group by status) t),

    'topics', (select coalesce(jsonb_agg(to_jsonb(t) order by t.count desc), '[]'::jsonb) from (
      select topic_category as topic, count(*) as count
      from rng where topic_category is not null group by topic_category) t),

    'durations', jsonb_build_array(
      jsonb_build_object('label', '< 1 min', 'count', (select count(*) from rng where connected and secs < 60)),
      jsonb_build_object('label', '1-5 min', 'count', (select count(*) from rng where connected and secs >= 60 and secs < 300)),
      jsonb_build_object('label', '5-15 min', 'count', (select count(*) from rng where connected and secs >= 300 and secs < 900)),
      jsonb_build_object('label', '15-30 min', 'count', (select count(*) from rng where connected and secs >= 900 and secs < 1800)),
      jsonb_build_object('label', '30+ min', 'count', (select count(*) from rng where connected and secs >= 1800))
    ),

    'hours', (select coalesce(jsonb_agg(to_jsonb(hr) order by hr.h), '[]'::jsonb) from hours hr),

    'money', jsonb_build_object(
      'revenue_today', (select coalesce(sum(inr), 0) from pur where created_at >= v_today_ts),
      'revenue_yesterday', (select coalesce(sum(inr), 0) from pur where d = v_today - 1),
      'revenue_range', (select coalesce(sum(inr), 0) from pur where created_at >= v_from_ts),
      'revenue_all', (select coalesce(sum(inr), 0) from pur),
      'purchases_today', (select count(*) from pur where created_at >= v_today_ts),
      'purchases_range', (select count(*) from pur where created_at >= v_from_ts),
      'purchases_all', (select count(*) from pur),
      'payers_all', (select count(*) from per_payer),
      'payers_range', (select count(distinct user_id) from pur where created_at >= v_from_ts),
      'repeat_payers', (select count(*) from per_payer where buys >= 2),
      'avg_order', (select round(avg(inr)) from pur where created_at >= v_from_ts),
      'arppu', (select round(avg(inr)) from per_payer),
      'conversion_pct', (select round(100.0 * (select count(*) from per_payer) / nullif((select count(*) from seekers), 0), 1)),
      'by_pack', (select coalesce(jsonb_agg(to_jsonb(t) order by t.price), '[]'::jsonb) from (
        select inr as price, count(*) as count, sum(inr) as revenue
        from pur where created_at >= v_from_ts group by inr) t),
      'coins_spent_calls', (select coalesce(-sum(amount), 0) from coin_transactions
                              where type = 'session_spend' and created_at >= v_from_ts),
      'coins_spent_gifts', (select coalesce(-sum(amount), 0) from coin_transactions
                              where type = 'gift_sent' and created_at >= v_from_ts),
      'coins_to_saathi', (select coalesce(sum(amount), 0) from coin_transactions
                            where type in ('session_earning', 'gift_received') and created_at >= v_from_ts),
      'coins_bonus', (select coalesce(sum(amount), 0) from coin_transactions
                        where type in ('bonus', 'free_credit') and created_at >= v_from_ts),
      'wallet_seekers', (select coalesce(sum(w.coin_balance), 0) from wallets w
                           join profiles p on p.id = w.user_id where p.role = 'seeker'),
      'wallet_saathi', (select coalesce(sum(w.coin_balance), 0) from wallets w
                          join profiles p on p.id = w.user_id where p.role = 'mentor'),
      'gifts_count', (select count(*) from gifts where created_at >= v_from_ts),
      'gifts_coins', (select coalesce(sum(coins), 0) from gifts where created_at >= v_from_ts),
      'top_gifts', (select coalesce(jsonb_agg(to_jsonb(t) order by t.coins desc), '[]'::jsonb) from (
        select gift_name as name, count(*) as count, sum(coins) as coins
        from gifts where created_at >= v_from_ts group by gift_name order by sum(coins) desc limit 6) t)
    ),

    'saathi', jsonb_build_object(
      'approved', (select count(*) from mentors where verification_status = 'approved'),
      'pending', (select count(*) from mentors where verification_status = 'pending'),
      'rejected', (select count(*) from mentors where verification_status = 'rejected'),
      'online_now', (select count(*) from mentors where is_online and verification_status = 'approved'),
      'active_today', (select count(*) from act_m_tdy),
      'active_range', (select count(*) from act_m_rng),
      'online_hours_today', (select round(coalesce(sum(seconds), 0) / 3600.0, 1) from mentor_online_time where day = v_today),
      'online_hours_range', (select round(coalesce(sum(seconds), 0) / 3600.0, 1) from mentor_online_time where day >= v_from),
      'avg_rating', (select round(avg(rating), 2) from rating_rng),
      'rating_count', (select count(*) from rating_rng),
      'rating_dist', (select coalesce(jsonb_agg(jsonb_build_object('stars', g, 'count',
                        (select count(*) from rating_rng rr where rr.rating = g)) order by g), '[]'::jsonb)
                      from generate_series(1, 5) g),
      'table', (select coalesce(jsonb_agg(to_jsonb(t) order by t.talk_minutes desc, t.name), '[]'::jsonb) from (
        select m.user_id as id, m.display_name as name, m.is_online, m.rating,
          (select count(*) from rng x where x.mentor_id = m.user_id) as requests,
          (select count(*) from rng x where x.mentor_id = m.user_id and x.connected) as sessions,
          (select count(*) from rng x where x.mentor_id = m.user_id and x.status in ('missed', 'declined')) as missed,
          (select round(coalesce(sum(x.secs), 0) / 60.0, 1) from rng x where x.mentor_id = m.user_id) as talk_minutes,
          (select coalesce(sum(o.seconds), 0) from mentor_online_time o
            where o.mentor_id = m.user_id and o.day >= v_from) as online_seconds,
          (select coalesce(sum(o.seconds), 0) from mentor_online_time o
            where o.mentor_id = m.user_id and o.day = v_today) as online_today,
          (select max(o.day) from mentor_online_time o
            where o.mentor_id = m.user_id and o.seconds > 0) as last_online,
          (select coalesce(sum(ct.amount), 0) from coin_transactions ct
            where ct.user_id = m.user_id and ct.type in ('session_earning', 'gift_received')
              and ct.created_at >= v_from_ts) as earned_coins,
          (select coalesce(w.coin_balance, 0) from wallets w where w.user_id = m.user_id) as wallet
        from mentors m
        where m.verification_status = 'approved') t),
      'applications', jsonb_build_object(
        'total', (select count(*) from saathi_applications),
        'today', (select count(*) from saathi_applications where created_at >= v_today_ts),
        'range', (select count(*) from saathi_applications where created_at >= v_from_ts),
        'pending', (select count(*) from saathi_applications where status = 'pending'),
        'shortlisted', (select count(*) from saathi_applications where status = 'shortlisted'),
        'rejected', (select count(*) from saathi_applications where status = 'rejected')
      ),
      'apply_funnel', (select coalesce(jsonb_agg(to_jsonb(f) order by f.step), '[]'::jsonb) from saathi_funnel f)
    ),

    'daily', (select coalesce(jsonb_agg(to_jsonb(dl) order by dl.d), '[]'::jsonb) from daily dl),
    'cohorts', (select coalesce(jsonb_agg(to_jsonb(c) order by c.week), '[]'::jsonb) from cohorts c),

    'top_spenders', (select coalesce(jsonb_agg(to_jsonb(t) order by t.inr desc), '[]'::jsonb) from (
      select se.username, right(coalesce(se.phone, ''), 4) as phone_tail,
             pp.inr, pp.buys, ps.talks, round(ps.secs / 60.0, 1) as minutes
      from per_payer pp
      join seekers se on se.id = pp.user_id
      join per_seeker ps on ps.id = pp.user_id
      order by pp.inr desc limit 10) t),

    'recent_purchases', (select coalesce(jsonb_agg(to_jsonb(t) order by t.at desc), '[]'::jsonb) from (
      select se.username, p.inr, p.coins, p.created_at as at
      from pur p left join seekers se on se.id = p.user_id
      order by p.created_at desc limit 15) t),

    'recent_signups', (select coalesce(jsonb_agg(to_jsonb(t) order by t.at desc), '[]'::jsonb) from (
      select se.username, se.age, se.created_at as at, ps.talks
      from seekers se join per_seeker ps on ps.id = se.id
      order by se.created_at desc limit 15) t),

    'recent_sessions', (select coalesce(jsonb_agg(to_jsonb(t) order by t.at desc), '[]'::jsonb) from (
      select se.username as seeker, m.display_name as saathi, x.mode, x.status, x.secs as seconds,
             x.coins, x.started_at as at
      from sx x
      left join seekers se on se.id = x.seeker_id
      left join mentors m on m.user_id = x.mentor_id
      order by x.started_at desc limit 15) t),

    'reports', jsonb_build_object(
      'open', (select count(*) from reports where status = 'open'),
      'reviewing', (select count(*) from reports where status = 'reviewing'),
      'range', (select count(*) from reports where created_at >= v_from_ts),
      'latest', (select coalesce(jsonb_agg(to_jsonb(t) order by t.at desc), '[]'::jsonb) from (
        select r.reason, r.status, r.created_at as at from reports r
        where r.status <> 'resolved' order by r.created_at desc limit 5) t)
    )
  ) into result;

  return result;
end;
$$;

-- Lock it down: only the service role (server-side) may run these.
revoke all on function admin_dashboard(int) from public, anon, authenticated;
revoke all on function admin_pack_inr(int) from public, anon, authenticated;
grant execute on function admin_dashboard(int) to service_role;
grant execute on function admin_pack_inr(int) to service_role;
