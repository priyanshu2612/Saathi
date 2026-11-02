// Mentor profile edits and the online/offline toggle. Runs with the
// service role for the same reason as bootstrap_profile: there's no real
// auth session for the "mentor updates own row" RLS policy to check.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { handleCors, json } from "../_shared/cors.ts";

// Rates (rate_chat/audio/video) are admin-only: set them in the database.
const EDITABLE_FIELDS = [
  "bio",
  "tags",
  "languages",
  "photo_url",
  "photos",
  "videos",
  "tagline",
  "is_online",
  "age",
  "gender",
  "nationality",
  "born_city",
  "qualification",
  "college",
  "school",
  "religion",
  "communication_tags",
  "personality_tags",
] as const;

Deno.serve(async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  const { userId, fields } = await req.json();

  if (!userId || typeof fields !== "object" || fields === null) {
    return json({ error: "userId and fields are required." }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  for (const key of EDITABLE_FIELDS) {
    if (key in fields) update[key] = fields[key];
  }
  if (Object.keys(update).length === 0) {
    return json({ error: "No editable fields provided." }, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { error } = await supabase.from("mentor_profiles").update(update).eq("user_id", userId);
  if (error) {
    return json({ error: error.message }, { status: 500 });
  }

  return json({ ok: true });
});
