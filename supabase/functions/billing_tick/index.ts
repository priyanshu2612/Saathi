// Runs on a schedule (Supabase cron, e.g. every 15–30s) via pg_cron + pg_net,
// or triggered by a client heartbeat that only supplies the session id (the
// function still recomputes everything server-side — the client can't tell
// it how many coins to charge).
//
// For every active session: charge elapsed time, and end the session if the
// wallet can't cover the next tick.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: activeSessions } = await supabase
    .from("sessions")
    .select("id, seeker_id, mentor_id, started_at, rate_per_minute, total_coins_charged")
    .eq("status", "active");

  for (const session of activeSessions ?? []) {
    const minutesElapsed = (Date.now() - new Date(session.started_at).getTime()) / 60000;
    const coinsDueTotal = Math.ceil(minutesElapsed * session.rate_per_minute);
    const coinsDueNow = coinsDueTotal - session.total_coins_charged;
    if (coinsDueNow <= 0) continue;

    const { data: wallet } = await supabase
      .from("wallets")
      .select("coin_balance")
      .eq("user_id", session.seeker_id)
      .single();

    if (!wallet || wallet.coin_balance < coinsDueNow) {
      await endSession(supabase, session.id);
      continue;
    }

    await supabase.rpc("apply_session_tick", {
      p_session_id: session.id,
      p_seeker_id: session.seeker_id,
      p_mentor_id: session.mentor_id,
      p_coins: coinsDueNow,
      p_mentor_share_pct: 65,
    });
  }

  return Response.json({ processed: activeSessions?.length ?? 0 });
});

async function endSession(supabase: ReturnType<typeof createClient>, sessionId: string) {
  await supabase
    .from("sessions")
    .update({ status: "completed", ended_at: new Date().toISOString() })
    .eq("id", sessionId);
}

/*
Companion SQL function (put in a migration), called above via rpc():

create or replace function apply_session_tick(
  p_session_id uuid, p_seeker_id uuid, p_mentor_id uuid,
  p_coins int, p_mentor_share_pct int
) returns void as $$
begin
  insert into coin_transactions (user_id, amount, type, related_session_id)
  values (p_seeker_id, -p_coins, 'session_spend', p_session_id);

  update wallets set coin_balance = coin_balance - p_coins, updated_at = now()
  where user_id = p_seeker_id;

  insert into coin_transactions (user_id, amount, type, related_session_id)
  values (p_mentor_id, floor(p_coins * p_mentor_share_pct / 100.0), 'session_earning', p_session_id);

  update wallets set coin_balance = coin_balance + floor(p_coins * p_mentor_share_pct / 100.0), updated_at = now()
  where user_id = p_mentor_id;

  update sessions set total_coins_charged = total_coins_charged + p_coins
  where id = p_session_id;
end;
$$ language plpgsql security definer;
*/
