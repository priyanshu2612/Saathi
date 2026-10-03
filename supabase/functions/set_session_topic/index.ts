// Saves the conversation topic the seeker locked in on the waiting screen.
// Only the session's seeker can set it, and only before the call ends.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { handleCors, json } from "../_shared/cors.ts";

const CATEGORIES = ["social", "dating", "life"];

Deno.serve(async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  const { userId, sessionId, category, topic } = await req.json();
  if (
    !userId ||
    !sessionId ||
    !CATEGORIES.includes(category) ||
    typeof topic !== "string" ||
    topic.length === 0 ||
    topic.length > 60
  ) {
    return json({ error: "A valid session, category and topic are required." }, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data, error } = await supabase
    .from("sessions")
    .update({ topic_category: category, topic })
    .eq("id", sessionId)
    .eq("seeker_id", userId)
    .in("status", ["ringing", "active"])
    .select("id")
    .maybeSingle();

  if (error) return json({ error: error.message }, { status: 500 });
  if (!data) return json({ error: "Session not found." }, { status: 404 });
  return json({ ok: true });
});
