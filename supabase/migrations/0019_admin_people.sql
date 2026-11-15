-- Admin "People" directory: every seeker, every Saathi and every Saathi
-- applicant with their details and lifetime activity. Service-role only,
-- like admin_dashboard (see 0018).
--
-- Each person gets a stable reference code derived from their id
-- (SK- seeker, ST- Saathi, AP- applicant). Saathi who were issued a login
-- code in mentor_invites also expose it as login_code.
-- Applications are linked to invites/Saathi by matching the last 10 digits
-- of the phone number.

create or replace function admin_people()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  with
  conn as (
    select s.seeker_id, s.mentor_id, s.started_at,
           least(extract(epoch from (coalesce(s.ended_at, now()) - s.started_at)), 10800)::int as secs
    from sessions s
    where s.status in ('active', 'completed')
  ),
  req as (
    select seeker_id, count(*) as n, max(started_at) as last_at
    from sessions group by seeker_id
  ),
  seeker_talk as (
    select seeker_id, count(*) as n, sum(secs) as secs
    from conn group by seeker_id
  ),
  buys as (
    select user_id, count(*) as n, sum(admin_pack_inr(amount)) as inr, max(created_at) as last_at
    from coin_transactions where type = 'purchase' group by user_id
  ),
  gifts_sent as (
    select seeker_id, count(*) as n, sum(coins) as coins
    from gifts group by seeker_id
  ),
  m_talk as (
    select mentor_id, count(*) as n, sum(secs) as secs, max(started_at) as last_at
    from conn group by mentor_id
  ),
  m_online as (
    select mentor_id, sum(seconds) as secs, max(last_beat) as last_beat,
           count(*) filter (where seconds > 0) as days
    from mentor_online_time group by mentor_id
  ),
  m_earn as (
    select user_id, sum(amount) as coins
    from coin_transactions
    where type in ('session_earning', 'gift_received') group by user_id
  ),
  inv as (
    select distinct on (claimed_by_user_id)
           claimed_by_user_id as uid, access_code, phone, status
    from mentor_invites
    where claimed_by_user_id is not null
    order by claimed_by_user_id, created_at desc
  ),
  apps as (
    select a.*, right(regexp_replace(a.phone, '\D', '', 'g'), 10) as p10
    from saathi_applications a
  )
  select jsonb_build_object(
    'users', (select coalesce(jsonb_agg(to_jsonb(t) order by t.joined desc), '[]'::jsonb) from (
      select p.id,
             'SK-' || upper(left(md5(p.id::text), 6)) as code,
             sa.username, p.display_name, sa.phone, sa.age,
             p.created_at as joined,
             greatest(rq.last_at, b.last_at) as last_active,
             coalesce(rq.n, 0) as requests,
             coalesce(st.n, 0) as sessions,
             coalesce(st.secs, 0) as talk_seconds,
             coalesce(b.n, 0) as purchases,
             coalesce(b.inr, 0) as spent_inr,
             coalesce(g.n, 0) as gifts_sent,
             coalesce(g.coins, 0) as gift_coins,
             coalesce(w.coin_balance, 0) as balance,
             coalesce(sa.locked_until > now(), false) as locked
      from profiles p
      left join seeker_accounts sa on sa.user_id = p.id
      left join req rq on rq.seeker_id = p.id
      left join seeker_talk st on st.seeker_id = p.id
      left join buys b on b.user_id = p.id
      left join gifts_sent g on g.seeker_id = p.id
      left join wallets w on w.user_id = p.id
      where p.role = 'seeker') t),

    'saathi', (select coalesce(jsonb_agg(to_jsonb(t) order by t.joined desc), '[]'::jsonb) from (
      select mp.user_id as id,
             'ST-' || upper(left(md5(mp.user_id::text), 6)) as code,
             iv.access_code as login_code,
             p.display_name as name,
             coalesce(iv.phone, ap.phone) as phone,
             ap.whatsapp_number as whatsapp,
             mp.verification_status as status,
             mp.is_online, mp.rating, mp.session_count,
             mp.created_at as joined,
             greatest(mo.last_beat, mt.last_at) as last_active,
             coalesce(mo.secs, 0) as online_seconds,
             coalesce(mo.days, 0) as online_days,
             coalesce(mt.n, 0) as sessions,
             coalesce(mt.secs, 0) as talk_seconds,
             coalesce(me.coins, 0) as earned_coins,
             coalesce(w.coin_balance, 0) as wallet,
             mp.bio, mp.tagline, mp.tags, mp.languages,
             mp.rate_chat, mp.rate_audio, mp.rate_video,
             mp.photo_url, mp.photos,
             mp.age, mp.gender, mp.nationality, mp.born_city, mp.qualification,
             mp.college, mp.school, mp.religion,
             mp.communication_tags, mp.personality_tags,
             ap.id as application_id
      from mentor_profiles mp
      join profiles p on p.id = mp.user_id
      left join inv iv on iv.uid = mp.user_id
      left join lateral (
        select a.* from apps a
        where iv.phone is not null
          and a.p10 = right(regexp_replace(iv.phone, '\D', '', 'g'), 10)
        order by a.created_at desc limit 1) ap on true
      left join m_talk mt on mt.mentor_id = mp.user_id
      left join m_online mo on mo.mentor_id = mp.user_id
      left join m_earn me on me.user_id = mp.user_id
      left join wallets w on w.user_id = mp.user_id) t),

    'applicants', (select coalesce(jsonb_agg(to_jsonb(t) order by t.joined desc), '[]'::jsonb) from (
      select a.id,
             'AP-' || upper(left(md5(a.id::text), 6)) as code,
             a.full_name as name, a.age, a.city_state as city,
             a.phone, a.whatsapp_number as whatsapp,
             a.languages, a.languages_other, a.profession, a.topics, a.modes,
             a.hours_per_week, a.availability_times, a.quiet_space, a.heard_about,
             a.photo_paths, a.status, a.created_at as joined,
             iv.claimed_by_user_id as saathi_id,
             iv.access_code as login_code,
             iv.status as invite_status
      from apps a
      left join lateral (
        select i.* from mentor_invites i
        where i.phone is not null
          and right(regexp_replace(i.phone, '\D', '', 'g'), 10) = a.p10
        order by i.created_at desc limit 1) iv on true) t)
  ) into result;

  return result;
end;
$$;

revoke all on function admin_people() from public, anon, authenticated;
grant execute on function admin_people() to service_role;
