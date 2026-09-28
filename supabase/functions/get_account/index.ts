// Reads wallet balance, recent coin transactions, and session history for a
// user id. Runs with the service role because — same reason as
// bootstrap_profile — there's no real auth session for RLS to check against.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { handleCors, json } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  const { userId } = await req.json();

  if (!userId) {
    return json({ error: "userId is required." }, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const [{ data: wallet }, { data: transactions }, { data: sessions }] = await Promise.all([
    supabase.from("wallets").select("coin_balance, updated_at").eq("user_id", userId).maybeSingle(),
    supabase
      .from("coin_transactions")
      .select("id, amount, type, related_session_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("sessions")
      .select("id, seeker_id, mentor_id, mode, started_at, ended_at, total_coins_charged, status, rate_per_minute")
      .or(`seeker_id.eq.${userId},mentor_id.eq.${userId}`)
      .order("started_at", { ascending: false })
      .limit(50),
  ]);

  return json({
    coinBalance: wallet?.coin_balance ?? 0,
    transactions: transactions ?? [],
    sessions: sessions ?? [],
  });
});
