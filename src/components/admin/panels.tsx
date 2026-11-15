"use client";

import { BarChart, Card, DailyChart, Grid, HBars, Pill, SectionTitle, Stat, Table, statusTone } from "./ui";
import { AdminStats } from "./types";
import { ago, delta, hoursFromSeconds, inr, mins, num, pct, secs, shortDay } from "./format";

const label = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const rangeText = (s: AdminStats) => `last ${s.range_days} days`;
const who = (n: string | null) => n ?? "—";

/* ───────────────────────── Overview ───────────────────────── */

export function Overview({ s }: { s: AdminStats }) {
  const newD = delta(s.users.new_today, s.users.new_yesterday);
  const revD = delta(s.money.revenue_today, s.money.revenue_yesterday);
  return (
    <>
      <Grid cols={3}>
        <Stat label="In a call right now" value={num(s.live.in_call)} sub={`${s.live.ringing} ringing`} tone={s.live.in_call ? "good" : "default"} />
        <Stat label="Saathi online now" value={num(s.live.saathi_online)} sub={`${s.saathi.approved} approved total`} tone={s.live.saathi_online ? "good" : "default"} />
        <Stat label="Open reports" value={num(s.reports.open + s.reports.reviewing)} sub={`${s.reports.open} open · ${s.reports.reviewing} reviewing`} tone={s.reports.open ? "bad" : "default"} />
      </Grid>

      <SectionTitle>Today</SectionTitle>
      <Grid>
        <Stat label="Active users" value={num(s.users.active_today)} sub={`of ${num(s.users.total)} total`} />
        <Stat label="Active Saathi" value={num(s.saathi.active_today)} sub={`${num(s.saathi.online_hours_today)}h online combined`} />
        <Stat label="Talking minutes" value={mins(s.talk.minutes_today)} sub={`${s.talk.sessions_today} connected sessions`} />
        <Stat label="Revenue" value={inr(s.money.revenue_today)} sub={`${s.money.purchases_today} purchases · ${revD.text}`} tone={revD.up === true ? "good" : revD.up === false ? "bad" : "default"} />
        <Stat label="New signups" value={num(s.users.new_today)} sub={newD.text} tone={newD.up === true ? "good" : newD.up === false ? "bad" : "default"} />
        <Stat label="Saathi applications" value={num(s.saathi.applications.today)} sub={`${s.saathi.applications.pending} awaiting review`} />
        <Stat label="Reach (DAU / MAU)" value={`${s.users.dau} / ${s.users.mau}`} sub={`Stickiness ${pct(s.users.dau, s.users.mau)}`} />
        <Stat label="Weekly active" value={num(s.users.wau)} sub="last 7 days" />
      </Grid>

      <SectionTitle>{`Totals — ${rangeText(s)}`}</SectionTitle>
      <Grid>
        <Stat label="Revenue" value={inr(s.money.revenue_range)} sub={`${s.money.purchases_range} purchases`} />
        <Stat label="Talking time" value={mins(s.talk.minutes_range)} sub={`${s.talk.sessions_range} sessions`} />
        <Stat label="New users" value={num(s.users.new_range)} sub={`${num(s.users.active_range)} were active`} />
        <Stat label="Connect rate" value={s.talk.connect_rate == null ? "–" : `${s.talk.connect_rate}%`} sub={`${s.talk.requests_range} requests`} />
      </Grid>

      <SectionTitle>Trends</SectionTitle>
      <div className="grid gap-3 lg:grid-cols-2">
        <DailyChart title="Revenue per day" rows={s.daily} pick={(r) => r.revenue} format={inr} total={inr(s.money.revenue_range)} />
        <DailyChart title="Active users per day" rows={s.daily} pick={(r) => r.active_seekers} color="bg-sage-400" />
        <DailyChart title="Talking minutes per day" rows={s.daily} pick={(r) => r.talk_minutes} format={mins} color="bg-gold-500" total={mins(s.talk.minutes_range)} />
        <DailyChart title="New signups per day" rows={s.daily} pick={(r) => r.new_seekers} color="bg-dusk-700" total={`${s.users.new_range} new`} />
      </div>

      <SectionTitle>Latest activity</SectionTitle>
      <div className="grid gap-3 lg:grid-cols-2">
        <Card title="Recent purchases">
          <Table
            head={["User", "Amount", "When"]}
            rows={s.recent_purchases.slice(0, 8).map((p) => [who(p.username), inr(p.inr), ago(p.at)])}
          />
        </Card>
        <Card title="Recent signups">
          <Table
            head={["User", "Age", "Talked", "When"]}
            rows={s.recent_signups.slice(0, 8).map((u) => [who(u.username), u.age ?? "–", u.talks, ago(u.at)])}
          />
        </Card>
      </div>
    </>
  );
}

/* ───────────────────────── Users ───────────────────────── */

export function Users({ s }: { s: AdminStats }) {
  const e = s.engagement;
  const top = s.funnel[0]?.count ?? 0;
  return (
    <>
      <Grid>
        <Stat label="Total users" value={num(s.users.total)} sub={s.users.avg_age ? `avg age ${s.users.avg_age}` : undefined} />
        <Stat label="Joined (range)" value={num(s.users.new_range)} sub={`${s.users.new_today} today`} />
        <Stat label="Active today" value={num(s.users.dau)} sub={`${pct(s.users.dau, s.users.total)} of all users`} />
        <Stat label="Active this week / month" value={`${s.users.wau} / ${s.users.mau}`} sub="7d / 30d" />
      </Grid>

      <SectionTitle>Session behaviour (all time)</SectionTitle>
      <Grid>
        <Stat label="One-time users" value={num(e.one_time)} sub={`${pct(e.one_time, e.talked_ever)} of those who talked`} tone={e.one_time > e.repeat ? "bad" : "default"} />
        <Stat label="Repeat users (2+)" value={num(e.repeat)} sub={`${pct(e.repeat, e.talked_ever)} of those who talked`} tone="good" />
        <Stat label="Power users (5+)" value={num(e.power)} sub={`${pct(e.power, e.talked_ever)} of those who talked`} />
        <Stat label="Never talked" value={num(e.never_talked)} sub={`${pct(e.never_talked, s.users.total)} of signups`} tone={e.never_talked > e.talked_ever ? "bad" : "default"} />
        <Stat label="Avg sessions / user" value={e.avg_sessions_per_talker == null ? "–" : String(e.avg_sessions_per_talker)} sub="among users who talked" />
        <Stat label="Avg talk time / user" value={mins(e.avg_minutes_per_talker)} sub="lifetime, among talkers" />
        <Stat label="Requested at least once" value={num(e.requested_ever)} sub={pct(e.requested_ever, s.users.total)} />
        <Stat label="Got connected" value={num(e.talked_ever)} sub={pct(e.talked_ever, s.users.total)} />
      </Grid>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <Card title="Sessions per user" hint="connected sessions, lifetime">
          <HBars rows={e.buckets.map((b) => ({ label: b.label, value: b.count }))} color="bg-sage-400" />
        </Card>
        <Card title="User funnel" hint="% of signups">
          <HBars
            of={top}
            rows={s.funnel.map((f) => ({ label: f.label, value: f.count, right: `${num(f.count)} · ${pct(f.count, top)}` }))}
          />
        </Card>
      </div>

      <SectionTitle>Growth</SectionTitle>
      <div className="grid gap-3 lg:grid-cols-2">
        <DailyChart title="New signups per day" rows={s.daily} pick={(r) => r.new_seekers} color="bg-dusk-700" total={`${s.users.new_range} in ${s.range_days}d`} />
        <DailyChart title="Active users per day" rows={s.daily} pick={(r) => r.active_seekers} color="bg-sage-400" />
      </div>

      <SectionTitle>Weekly cohorts</SectionTitle>
      <Card hint="by signup week (last ~8 weeks)">
        <Table
          head={["Week of", "Joined", "Talked", "Repeated", "Paid", "Talk %", "Paid %"]}
          rows={s.cohorts.map((c) => [
            shortDay(c.week), c.joined, c.talked, c.repeated, c.paid, pct(c.talked, c.joined), pct(c.paid, c.joined),
          ])}
        />
      </Card>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <Card title="Top spenders" hint="all time">
          <Table
            head={["User", "Paid", "Buys", "Sessions", "Talk"]}
            rows={s.top_spenders.map((u) => [`${who(u.username)} ··${u.phone_tail}`, inr(u.inr), u.buys, u.talks, mins(u.minutes)])}
          />
        </Card>
        <Card title="Recent signups">
          <Table
            head={["User", "Age", "Talked", "When"]}
            rows={s.recent_signups.map((u) => [who(u.username), u.age ?? "–", u.talks, ago(u.at)])}
          />
        </Card>
      </div>
    </>
  );
}

/* ───────────────────────── Saathi ───────────────────────── */

export function SaathiPanel({ s }: { s: AdminStats }) {
  const a = s.saathi;
  const f0 = a.apply_funnel[0]?.visitors ?? 0;
  return (
    <>
      <Grid>
        <Stat label="Approved Saathi" value={num(a.approved)} sub={`${a.pending} pending · ${a.rejected} rejected`} />
        <Stat label="Online now" value={num(a.online_now)} tone={a.online_now ? "good" : "default"} />
        <Stat label="Active today" value={num(a.active_today)} sub={`${a.active_range} in ${rangeText(s)}`} />
        <Stat label="Online hours today" value={`${num(a.online_hours_today)}h`} sub={`${num(a.online_hours_range)}h in range`} />
        <Stat label="Avg rating" value={a.avg_rating == null ? "–" : `${a.avg_rating} ★`} sub={`${a.rating_count} ratings in range`} />
        <Stat label="Applications (range)" value={num(a.applications.range)} sub={`${a.applications.today} today`} />
        <Stat label="Awaiting review" value={num(a.applications.pending)} sub={`${a.applications.shortlisted} shortlisted`} tone={a.applications.pending ? "bad" : "default"} />
        <Stat label="Total applications" value={num(a.applications.total)} sub={`${a.applications.rejected} rejected`} />
      </Grid>

      <SectionTitle>{`Saathi performance — ${rangeText(s)}`}</SectionTitle>
      <Card>
        <Table
          head={["Saathi", "Status", "Talk", "Sessions", "Requests", "Missed", "Online", "Today", "Earned", "Rating", "Last seen"]}
          rows={a.table.map((m) => [
            m.name,
            m.is_online ? <Pill key="s" tone="good">Online</Pill> : <Pill key="s">Offline</Pill>,
            mins(m.talk_minutes),
            m.sessions,
            m.requests,
            m.missed > 0 ? <span key="m" className="text-warmth-600">{m.missed}</span> : 0,
            hoursFromSeconds(m.online_seconds),
            hoursFromSeconds(m.online_today),
            `${num(m.earned_coins)} 🪙`,
            m.rating ? `${m.rating} ★` : "–",
            m.last_online ? shortDay(m.last_online) : "never",
          ])}
        />
      </Card>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <Card title="Ratings" hint={rangeText(s)}>
          <HBars
            color="bg-gold-500"
            rows={[...a.rating_dist].reverse().map((r) => ({ label: `${r.stars} ★`, value: r.count }))}
          />
        </Card>
        <Card title="Active Saathi per day">
          <DailyChartInline s={s} />
        </Card>
      </div>

      <SectionTitle>Recruiting</SectionTitle>
      <div className="grid gap-3 lg:grid-cols-2">
        <Card title="Application form funnel" hint="visitors reaching each step, all time">
          <HBars
            of={f0}
            color="bg-dusk-700"
            rows={a.apply_funnel.map((f) => ({
              label: f.label,
              value: f.visitors,
              right: `${f.visitors}${f.pct_of_start != null ? ` · ${f.pct_of_start}%` : ""}${f.lost_from_previous ? ` (−${f.lost_from_previous})` : ""}`,
            }))}
          />
        </Card>
        <Card title="Safety reports">
          <Grid cols={2}>
            <Stat label="Open" value={num(s.reports.open)} tone={s.reports.open ? "bad" : "default"} />
            <Stat label="Reviewing" value={num(s.reports.reviewing)} />
          </Grid>
          <div className="mt-3">
            <Table
              head={["Reason", "Status", "When"]}
              rows={s.reports.latest.map((r) => [<span key="r" className="block max-w-[260px] truncate text-left">{r.reason}</span>, r.status, ago(r.at)])}
              empty="No unresolved reports"
            />
          </div>
        </Card>
      </div>
    </>
  );
}

function DailyChartInline({ s }: { s: AdminStats }) {
  return (
    <BarChart
      data={s.daily.map((r) => ({ label: shortDay(r.d), value: r.active_saathi }))}
      color="bg-sage-400"
    />
  );
}

/* ───────────────────────── Money ───────────────────────── */

export function Money({ s }: { s: AdminStats }) {
  const m = s.money;
  const revD = delta(m.revenue_today, m.revenue_yesterday);
  const spent = m.coins_spent_calls + m.coins_spent_gifts;
  const kept = spent - m.coins_to_saathi;
  return (
    <>
      <Grid>
        <Stat label="Revenue today" value={inr(m.revenue_today)} sub={revD.text} tone={revD.up === true ? "good" : revD.up === false ? "bad" : "default"} />
        <Stat label={`Revenue (${s.range_days}d)`} value={inr(m.revenue_range)} sub={`${m.purchases_range} purchases`} />
        <Stat label="Revenue all time" value={inr(m.revenue_all)} sub={`${m.purchases_all} purchases`} />
        <Stat label="Avg order value" value={inr(m.avg_order)} sub={`in ${rangeText(s)}`} />
        <Stat label="Paying users" value={num(m.payers_all)} sub={`${m.payers_range} in range`} />
        <Stat label="Conversion" value={m.conversion_pct == null ? "–" : `${m.conversion_pct}%`} sub="signups who ever paid" />
        <Stat label="Repeat buyers" value={num(m.repeat_payers)} sub={pct(m.repeat_payers, m.payers_all) + " of payers"} tone="good" />
        <Stat label="Revenue per payer" value={inr(m.arppu)} sub="lifetime" />
      </Grid>

      <SectionTitle>Trends</SectionTitle>
      <div className="grid gap-3 lg:grid-cols-2">
        <DailyChart title="Revenue per day" rows={s.daily} pick={(r) => r.revenue} format={inr} total={inr(m.revenue_range)} />
        <DailyChart title="Purchases per day" rows={s.daily} pick={(r) => r.purchases} color="bg-gold-500" />
      </div>

      <SectionTitle>{`Coin economy — ${rangeText(s)}`}</SectionTitle>
      <Grid>
        <Stat label="Spent on calls" value={num(m.coins_spent_calls)} sub="coins" />
        <Stat label="Spent on gifts" value={num(m.coins_spent_gifts)} sub={`${m.gifts_count} gifts`} />
        <Stat label="Paid to Saathi (65%)" value={num(m.coins_to_saathi)} sub="coins earned by Saathi" />
        <Stat label="Platform keeps" value={num(kept)} sub={pct(kept, spent) + " of spend"} tone="good" />
        <Stat label="Bonus / free coins given" value={num(m.coins_bonus)} sub="cost of promos" />
        <Stat label="Seeker wallets" value={num(m.wallet_seekers)} sub="unspent coins (liability)" />
        <Stat label="Saathi wallets" value={num(m.wallet_saathi)} sub="owed to Saathi" tone="bad" />
        <Stat label="Gift coins" value={num(m.gifts_coins)} sub="total value gifted" />
      </Grid>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <Card title="Sales by pack" hint={rangeText(s)}>
          <HBars
            color="bg-gold-500"
            rows={m.by_pack.map((p) => ({ label: `₹${p.price} pack`, value: p.revenue, right: `${p.count} × = ${inr(p.revenue)}` }))}
            emptyText="No purchases in this range"
          />
        </Card>
        <Card title="Top gifts" hint={rangeText(s)}>
          <HBars
            rows={m.top_gifts.map((g) => ({ label: g.name, value: g.coins, right: `${g.count} · ${num(g.coins)} 🪙` }))}
            emptyText="No gifts in this range"
          />
        </Card>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <Card title="Recent purchases">
          <Table head={["User", "Amount", "Coins", "When"]} rows={s.recent_purchases.map((p) => [who(p.username), inr(p.inr), num(p.coins), ago(p.at)])} />
        </Card>
        <Card title="Top spenders" hint="all time">
          <Table head={["User", "Paid", "Buys"]} rows={s.top_spenders.map((u) => [`${who(u.username)} ··${u.phone_tail}`, inr(u.inr), u.buys])} />
        </Card>
      </div>
      <p className="mt-3 text-[11px] text-dusk-400">
        Revenue is derived from pack coin amounts (₹249/550/1150/3000 coins → ₹249/499/999/2499). Confirm
        exact settlements in your Cashfree dashboard.
      </p>
    </>
  );
}

/* ───────────────────────── Calls ───────────────────────── */

export function Calls({ s }: { s: AdminStats }) {
  const t = s.talk;
  const maxH = Math.max(1, ...s.hours.map((h) => h.requests));
  return (
    <>
      <Grid>
        <Stat label="Talking time today" value={mins(t.minutes_today)} sub={`${t.sessions_today} sessions`} />
        <Stat label={`Talking time (${s.range_days}d)`} value={mins(t.minutes_range)} sub={`${t.sessions_range} sessions`} />
        <Stat label="Talking time all time" value={mins(t.minutes_all)} sub={`${t.sessions_all} sessions`} />
        <Stat label="Connect rate" value={t.connect_rate == null ? "–" : `${t.connect_rate}%`} sub={`${t.requests_range} requests in range`} />
        <Stat label="Avg session" value={secs(t.avg_seconds)} sub="connected, in range" />
        <Stat label="Median session" value={secs(t.median_seconds)} />
        <Stat label="Longest session" value={secs(t.longest_seconds)} />
        <Stat label="Unanswered requests" value={num(s.daily.reduce((a, d) => a + d.unanswered, 0))} sub="missed / declined / cancelled" tone="bad" />
      </Grid>

      <SectionTitle>Trends</SectionTitle>
      <div className="grid gap-3 lg:grid-cols-2">
        <DailyChart title="Talking minutes per day" rows={s.daily} pick={(r) => r.talk_minutes} format={mins} color="bg-gold-500" total={mins(t.minutes_range)} />
        <DailyChart title="Connected sessions per day" rows={s.daily} pick={(r) => r.sessions} color="bg-sage-400" total={`${t.sessions_range} total`} />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <Card title="By mode" hint={rangeText(s)}>
          <Table
            head={["Mode", "Sessions", "Minutes", "Avg", "Coins"]}
            rows={s.by_mode.map((m) => [label(m.mode), m.sessions, mins(m.minutes), secs(m.avg_seconds), num(m.coins)])}
          />
        </Card>
        <Card title="Request outcomes" hint={rangeText(s)}>
          <HBars
            rows={s.outcomes.map((o) => ({ label: label(o.status), value: o.count }))}
            color="bg-dusk-700"
          />
        </Card>
        <Card title="Session length" hint="connected sessions">
          <HBars rows={s.durations.map((d) => ({ label: d.label, value: d.count }))} color="bg-sage-400" />
        </Card>
        <Card title="Topics" hint="what people talk about">
          <HBars rows={s.topics.map((o) => ({ label: label(o.topic), value: o.count }))} emptyText="No topic data" />
        </Card>
      </div>

      <SectionTitle>Busiest hours (IST)</SectionTitle>
      <Card hint="requests by hour of day">
        <div className="flex h-36 items-end gap-[3px]">
          {s.hours.map((h) => (
            <div key={h.h} className="flex h-full min-w-0 flex-1 items-end" title={`${h.h}:00 — ${h.requests} requests, ${h.connected} connected`}>
              <div className="w-full rounded-t-[3px] bg-warmth-500" style={{ height: `${Math.max(2, (h.requests / maxH) * 100)}%`, opacity: h.requests ? 1 : 0.2 }} />
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex gap-[3px] text-[10px] text-dusk-400">
          {s.hours.map((h) => (
            <div key={h.h} className="min-w-0 flex-1">{h.h % 3 === 0 ? h.h : ""}</div>
          ))}
        </div>
      </Card>

      <SectionTitle>Latest sessions</SectionTitle>
      <Card>
        <Table
          head={["Seeker", "Saathi", "Mode", "Status", "Length", "Coins", "When"]}
          rows={s.recent_sessions.map((r) => [
            who(r.seeker), who(r.saathi), label(r.mode),
            <Pill key="p" tone={statusTone(r.status)}>{r.status}</Pill>,
            r.seconds ? secs(r.seconds) : "–", r.coins, ago(r.at),
          ])}
        />
      </Card>
    </>
  );
}
