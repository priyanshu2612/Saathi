// Charges a single billing tick for one active session. The live chat/call
// screen calls this roughly every 6s (src/lib/useSessionBilling.ts) instead
// of relying on billing_tick's cron sweep, since this deployment has no
// pg_cron schedule set up. billing_tick (same apply_session_tick RPC) still
// exists as the correct production path once a schedule is configured —
// this function recomputes the charge server-side either way, never trusting
// the coin amount the client thinks is due.

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

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("id, seeker_id, mentor_id, started_at, rate_per_minute, total_coins_charged, status")
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    return json({ error: "Session not found." }, { status: 404 });
  }

  const { data: wallet } = await supabase
    .from("wallets")
    .select("coin_balance")
    .eq("user_id", session.seeker_id)
    .single();
  const coinBalance = wallet?.coin_balance ?? 0;

  if (session.status !== "active") {
    return json({ ended: true, coinsCharged: session.total_coins_charged, coinBalance });
  }

  const minutesElapsed = (Date.now() - new Date(session.started_at).getTime()) / 60000;
  const coinsDueTotal = Math.ceil(minutesElapsed * session.rate_per_minute);
  const coinsDueNow = coinsDueTotal - session.total_coins_charged;

  if (coinsDueNow <= 0) {
    return json({ ended: false, coinsCharged: session.total_coins_charged, coinBalance });
  }

  if (coinBalance < coinsDueNow) {
    await supabase
      .from("sessions")
      .update({ status: "completed", ended_at: new Date().toISOString() })
      .eq("id", sessionId);
    return json({ ended: true, coinsCharged: session.total_coins_charged, coinBalance });
  }

  await supabase.rpc("apply_session_tick", {
    p_session_id: sessionId,
    p_seeker_id: session.seeker_id,
    p_mentor_id: session.mentor_id,
    p_coins: coinsDueNow,
    p_mentor_share_pct: 65,
  });

  return json({
    ended: false,
    coinsCharged: session.total_coins_charged + coinsDueNow,
    coinBalance: coinBalance - coinsDueNow,
  });
});
