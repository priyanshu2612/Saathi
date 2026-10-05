// Records that an anonymous visitor reached a step of the Saathi application.
//   { visitorId, step } -> { ok: true }
// Best-effort and unauthenticated by design (applicants aren't signed in), so
// input is strictly validated and nothing but the step number is stored.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { handleCors, json } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  const { visitorId, step } = await req.json();
  if (
    typeof visitorId !== "string" ||
    !/^[A-Za-z0-9-]{8,64}$/.test(visitorId) ||
    !Number.isInteger(step) ||
    step < 0 ||
    step > 8
  ) {
    return json({ error: "Invalid event." }, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const { error } = await supabase.from("saathi_funnel_events").insert({ visitor_id: visitorId, step });
  if (error) return json({ error: "Couldn't record that." }, { status: 500 });
  return json({ ok: true });
});
