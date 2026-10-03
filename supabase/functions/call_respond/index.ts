// The Saathi accepts or declines a ringing call. Accepting flips the session
// to 'active' and resets started_at so per-minute billing only counts
// connected time, not the seconds spent ringing.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { handleCors, json } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  const { mentorId, sessionId, action } = await req.json();
  if (!mentorId || !sessionId || !["accept", "decline"].includes(action)) {
    return json({ error: "mentorId, sessionId and a valid action are required." }, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const now = new Date().toISOString();
  const patch =
    action === "accept"
      ? { status: "active", started_at: now }
      : { status: "declined", ended_at: now };

  // Conditional on status = 'ringing' so a call that already timed out or was
  // cancelled by the seeker can't be resurrected.
  const { data: session, error } = await supabase
    .from("sessions")
    .update(patch)
    .eq("id", sessionId)
    .eq("mentor_id", mentorId)
    .eq("status", "ringing")
    .select("id, status")
    .maybeSingle();

  if (error) return json({ error: error.message }, { status: 500 });
  if (!session) {
    return json({ error: "This call is no longer available." }, { status: 409 });
  }
  return json({ session });
});
