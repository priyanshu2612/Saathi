// Saathi stats: online-time heartbeat, daily dashboard and leaderboard.
//   { action: "heartbeat", mentorId }                 -> { onlineSeconds }
//   { action: "dashboard", mentorId, date? }          -> { date, received, rejected, talkSeconds, onlineSeconds }
//   { action: "leaderboard", mentorId }               -> { entries, me }
// Days are India (IST) calendar days, "YYYY-MM-DD".

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { handleCors, json } from "../_shared/cors.ts";

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
// Heartbeats arrive every ~30s; anything longer than this is a gap (tab
// closed, phone asleep) and isn't counted as online time.
const MAX_GAP_SECONDS = 75;
const LEADERBOARD_SIZE = 10;

const istDay = (ms: number) => new Date(ms + IST_OFFSET_MS).toISOString().slice(0, 10);
const dayStartMs = (day: string) => Date.parse(`${day}T00:00:00+05:30`);

Deno.serve(async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  const { action, mentorId, date } = await req.json().catch(() => ({}));
  if (!["heartbeat", "dashboard", "leaderboard"].includes(action) || !mentorId) {
    return json({ error: "action and mentorId are required." }, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const nowMs = Date.now();
  const today = istDay(nowMs);

  const { data: mentor } = await supabase
    .from("mentor_profiles")
    .select("user_id")
    .eq("user_id", mentorId)
    .maybeSingle();
  if (!mentor) return json({ error: "Saathi not found." }, { status: 404 });

  if (action === "heartbeat") {
    const { data: row } = await supabase
      .from("mentor_online_time")
      .select("seconds, last_beat")
      .eq("mentor_id", mentorId)
      .eq("day", today)
      .maybeSingle();

    const gap = row ? (nowMs - new Date(row.last_beat).getTime()) / 1000 : 0;
    const add = row && gap > 0 && gap <= MAX_GAP_SECONDS ? Math.round(gap) : 0;
    const seconds = (row?.seconds ?? 0) + add;

    await supabase.from("mentor_online_time").upsert({
      mentor_id: mentorId,
      day: today,
      seconds,
      last_beat: new Date(nowMs).toISOString(),
    });
    return json({ onlineSeconds: seconds });
  }

  if (action === "dashboard") {
    const day = typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : today;
    const from = new Date(dayStartMs(day)).toISOString();
    const to = new Date(dayStartMs(day) + 24 * 60 * 60 * 1000).toISOString();

    const [{ data: sessions }, { data: online }] = await Promise.all([
      supabase
        .from("sessions")
        .select("status, started_at, ended_at")
        .eq("mentor_id", mentorId)
        .gte("started_at", from)
        .lt("started_at", to),
      supabase
        .from("mentor_online_time")
        .select("seconds")
        .eq("mentor_id", mentorId)
        .eq("day", day)
        .maybeSingle(),
    ]);

    let received = 0;
    let rejected = 0;
    let talkSeconds = 0;
    for (const s of sessions ?? []) {
      if (s.status === "cancelled") continue; // seeker hung up before it mattered
      received += 1;
      if (s.status === "declined" || s.status === "missed") {
        rejected += 1;
      } else if (["active", "completed", "disputed"].includes(s.status)) {
        const end = s.ended_at ? new Date(s.ended_at).getTime() : nowMs;
        talkSeconds += Math.max(0, Math.round((end - new Date(s.started_at).getTime()) / 1000));
      }
    }
    return json({ date: day, received, rejected, talkSeconds, onlineSeconds: online?.seconds ?? 0 });
  }

  // leaderboard
  const { data: rows } = await supabase
    .from("mentor_online_time")
    .select("mentor_id, seconds")
    .eq("day", today)
    .gt("seconds", 0)
    .order("seconds", { ascending: false })
    .limit(LEADERBOARD_SIZE);

  const ids = (rows ?? []).map((r) => r.mentor_id);
  const { data: profiles } = ids.length
    ? await supabase.from("profiles").select("id, display_name").in("id", ids)
    : { data: [] as { id: string; display_name: string | null }[] };
  const names = new Map((profiles ?? []).map((p) => [p.id, p.display_name ?? "Saathi"]));

  const entries = (rows ?? []).map((r, i) => ({
    rank: i + 1,
    mentorId: r.mentor_id,
    name: names.get(r.mentor_id) ?? "Saathi",
    seconds: r.seconds,
    isMe: r.mentor_id === mentorId,
  }));

  let me = entries.find((e) => e.isMe) ?? null;
  if (!me) {
    const { data: mine } = await supabase
      .from("mentor_online_time")
      .select("seconds")
      .eq("mentor_id", mentorId)
      .eq("day", today)
      .maybeSingle();
    if (mine && mine.seconds > 0) {
      const { count } = await supabase
        .from("mentor_online_time")
        .select("mentor_id", { count: "exact", head: true })
        .eq("day", today)
        .gt("seconds", mine.seconds);
      me = { rank: (count ?? 0) + 1, mentorId, name: "You", seconds: mine.seconds, isMe: true };
    }
  }
  return json({ entries, me });
});
