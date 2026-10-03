// Polled by both sides of a video call while it's being set up / running.
//   { role: "seeker", userId, sessionId } -> that session's status + topic
//   { role: "mentor", userId }            -> calls currently ringing this mentor
//   { role: "mentor", userId, sessionId } -> one session (topic + seeker name)
// Ringing calls older than RING_SECONDS are flipped to 'missed' here, so no
// cron is needed.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { handleCors, json } from "../_shared/cors.ts";

const RING_SECONDS = 60;

Deno.serve(async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  const { role, userId, sessionId } = await req.json();
  if (!["seeker", "mentor"].includes(role) || !userId) {
    return json({ error: "role and userId are required." }, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const column = role === "seeker" ? "seeker_id" : "mentor_id";
  const cutoff = new Date(Date.now() - RING_SECONDS * 1000).toISOString();
  await supabase
    .from("sessions")
    .update({ status: "missed", ended_at: new Date().toISOString() })
    .eq(column, userId)
    .eq("status", "ringing")
    .lt("started_at", cutoff);

  const select =
    "id, seeker_id, mentor_id, mode, status, started_at, topic_category, topic";

  const seekerName = async (seekerId: string) => {
    const { data } = await supabase
      .from("seeker_accounts")
      .select("username")
      .eq("user_id", seekerId)
      .maybeSingle();
    return data?.username ?? "A seeker";
  };

  if (sessionId) {
    const { data: session } = await supabase
      .from("sessions")
      .select(select)
      .eq("id", sessionId)
      .eq(column, userId)
      .maybeSingle();
    if (!session) return json({ error: "Session not found." }, { status: 404 });
    // The Saathi's call screen shows gifts the seeker sends mid-call.
    const { data: gifts } =
      role === "mentor"
        ? await supabase
            .from("gifts")
            .select("id, gift_id, gift_name, mentor_coins, created_at")
            .eq("session_id", sessionId)
            .order("created_at", { ascending: true })
        : { data: null };
    return json({
      session: {
        id: session.id,
        status: session.status,
        startedAt: session.started_at,
        topicCategory: session.topic_category,
        topic: session.topic,
        seekerName: role === "mentor" ? await seekerName(session.seeker_id) : undefined,
        gifts: (gifts ?? []).map((g) => ({
          id: g.id,
          giftId: g.gift_id,
          giftName: g.gift_name,
          mentorCoins: g.mentor_coins,
          createdAt: g.created_at,
        })),
      },
    });
  }

  if (role === "seeker") {
    return json({ error: "sessionId is required." }, { status: 400 });
  }

  const { data: ringing } = await supabase
    .from("sessions")
    .select(select)
    .eq("mentor_id", userId)
    .eq("status", "ringing")
    .order("started_at", { ascending: true });

  const calls = await Promise.all(
    (ringing ?? []).map(async (s) => ({
      id: s.id,
      mode: s.mode,
      startedAt: s.started_at,
      topicCategory: s.topic_category,
      topic: s.topic,
      seekerName: await seekerName(s.seeker_id),
    }))
  );
  return json({ calls });
});
