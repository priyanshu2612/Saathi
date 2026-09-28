// Creates a session only if the seeker can afford at least one minute.
// Called by the client; never trust the client to decide whether billing
// should start — that decision (and every coin write) happens here, with
// the service-role key, which bypasses RLS.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { handleCors, json } from "../_shared/cors.ts";

const RATE_COLUMN = { chat: "rate_chat", audio: "rate_audio", video: "rate_video" } as const;

Deno.serve(async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  const { seekerId, mentorId, mode = "chat" } = await req.json();

  if (!(mode in RATE_COLUMN)) {
    return json({ error: "Invalid session mode." }, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: mentor, error: mentorError } = await supabase
    .from("mentor_profiles")
    .select("rate_chat, rate_audio, rate_video, is_online, verification_status")
    .eq("user_id", mentorId)
    .single();

  if (mentorError || !mentor || mentor.verification_status !== "approved" || !mentor.is_online) {
    return json({ error: "Mentor is not available." }, { status: 400 });
  }

  const ratePerMinute = mentor[RATE_COLUMN[mode as keyof typeof RATE_COLUMN]];
  if (!ratePerMinute) {
    return json({ error: "Mentor doesn't offer this session type." }, { status: 400 });
  }

  const { data: wallet } = await supabase
    .from("wallets")
    .select("coin_balance")
    .eq("user_id", seekerId)
    .single();

  if (!wallet || wallet.coin_balance < ratePerMinute) {
    return json({ error: "Not enough coins for a minute of this session." }, { status: 402 });
  }

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .insert({
      seeker_id: seekerId,
      mentor_id: mentorId,
      mode,
      rate_per_minute: ratePerMinute,
    })
    .select()
    .single();

  if (sessionError) {
    return json({ error: sessionError.message }, { status: 500 });
  }

  return json({ session });
});
