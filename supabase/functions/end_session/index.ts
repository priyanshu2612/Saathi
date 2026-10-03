// Called when either side hangs up. Finalizes the session; the last partial
// tick is settled by billing_tick's own logic before this runs, or you can
// call apply_session_tick once more here for the final partial minute.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { handleCors, json } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  const { sessionId } = await req.json();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // A call hung up while still ringing was never connected — mark it
  // cancelled rather than completed so it never shows up in history.
  const endedAt = new Date().toISOString();
  await supabase
    .from("sessions")
    .update({ status: "cancelled", ended_at: endedAt })
    .eq("id", sessionId)
    .eq("status", "ringing");

  const { data: session, error } = await supabase
    .from("sessions")
    .update({ status: "completed", ended_at: endedAt })
    .eq("id", sessionId)
    .eq("status", "active")
    .select()
    .maybeSingle();

  if (error) {
    return json({ error: error.message }, { status: 500 });
  }

  return json({ session });
});
