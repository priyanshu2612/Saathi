// In-call chat between the two people on a session.
//   { action: "send", userId, sessionId, body } -> { message }
//   { action: "list", userId, sessionId, after? } -> { messages, status }
//   { action: "inbox", userId } -> { chats }  (a Saathi's live chat sessions)
// Only the session's seeker or Saathi may read or write, and only while the
// call is active (reads stay open afterwards so the thread isn't lost).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { handleCors, json } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  const { action, userId, sessionId, body, after } = await req.json();
  if (!["send", "list", "inbox"].includes(action) || !userId || (action !== "inbox" && !sessionId)) {
    return json({ error: "action, userId and sessionId are required." }, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );


  // A Saathi's live chats: active chat sessions from the last 3 hours, with the
  // latest message so the app can show a preview and ring for new ones.
  if (action === "inbox") {
    const since = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    const { data: sessions } = await supabase
      .from("sessions")
      .select("id, seeker_id, started_at")
      .eq("mentor_id", userId)
      .eq("mode", "chat")
      .eq("status", "active")
      .gte("started_at", since)
      .order("started_at", { ascending: false })
      .limit(20);
    const chats = await Promise.all(
      (sessions ?? []).map(async (s) => {
        const [{ data: acct }, { data: last }] = await Promise.all([
          supabase.from("seeker_accounts").select("username").eq("user_id", s.seeker_id).maybeSingle(),
          supabase
            .from("session_messages")
            .select("id, sender_id, body, created_at")
            .eq("session_id", s.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);
        return {
          id: s.id,
          seekerName: acct?.username ?? "A seeker",
          startedAt: s.started_at,
          last: last
            ? { id: last.id, mine: last.sender_id === userId, body: last.body, createdAt: last.created_at }
            : null,
        };
      })
    );
    return json({ chats });
  }

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
    status: session.status,
    messages: (rows ?? []).map((m) => ({
      id: m.id,
      mine: m.sender_id === userId,
      body: m.body,
      createdAt: m.created_at,
    })),
  });
});
