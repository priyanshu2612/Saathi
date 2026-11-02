// In-call chat between the two people on a session.
//   { action: "send", userId, sessionId, body } -> { message }
//   { action: "list", userId, sessionId, after? } -> { messages }
// Only the session's seeker or Saathi may read or write, and only while the
// call is active (reads stay open afterwards so the thread isn't lost).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { handleCors, json } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  const { action, userId, sessionId, body, after } = await req.json();
  if (!["send", "list"].includes(action) || !userId || !sessionId) {
    return json({ error: "action, userId and sessionId are required." }, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: session } = await supabase
    .from("sessions")
    .select("id, seeker_id, mentor_id, status")
    .eq("id", sessionId)
    .or(`seeker_id.eq.${userId},mentor_id.eq.${userId}`)
    .maybeSingle();
  if (!session) return json({ error: "Session not found." }, { status: 404 });

  if (action === "send") {
    const text = typeof body === "string" ? body.trim() : "";
    if (!text || text.length > 500) {
      return json({ error: "Message must be 1-500 characters." }, { status: 400 });
    }
    if (session.status !== "active") {
      return json({ error: "Chat is only available during a live call." }, { status: 409 });
    }
    const { data: message, error } = await supabase
      .from("session_messages")
      .insert({ session_id: sessionId, sender_id: userId, body: text })
      .select("id, sender_id, body, created_at")
      .single();
    if (error || !message) return json({ error: "Couldn't send the message." }, { status: 500 });
    return json({
      message: {
        id: message.id,
        mine: true,
        body: message.body,
        createdAt: message.created_at,
      },
    });
  }

  let query = supabase
    .from("session_messages")
    .select("id, sender_id, body, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(200);
  if (typeof after === "string" && after) query = query.gt("created_at", after);
  const { data: rows } = await query;

  return json({
    messages: (rows ?? []).map((m) => ({
      id: m.id,
      mine: m.sender_id === userId,
      body: m.body,
      createdAt: m.created_at,
    })),
  });
});
