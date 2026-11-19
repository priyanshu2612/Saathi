// The one-time "recharge within 5 minutes for 50 extra coins" offer.
//   { userId } -> { active, secondsLeft, bonusCoins }
// The first call starts the 5-minute clock (stored server-side so it can't be
// reset by clearing the browser). The bonus itself is credited by the
// Cashfree webhook, which re-checks the offer.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { handleCors, json } from "../_shared/cors.ts";
import { OFFER_BONUS_COINS, OFFER_MINUTES } from "../_shared/packs.ts";

Deno.serve(async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  const { userId } = await req.json().catch(() => ({}));
  if (!userId) return json({ error: "userId is required." }, { status: 400 });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: account } = await supabase
    .from("seeker_accounts")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!account) return json({ error: "Seeker not found." }, { status: 404 });

  await supabase
    .from("recharge_offers")
    .upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });

  const { data: offer } = await supabase
    .from("recharge_offers")
    .select("started_at, redeemed_at")
    .eq("user_id", userId)
    .single();

  const secondsLeft = offer
    ? Math.max(0, Math.round((new Date(offer.started_at).getTime() + OFFER_MINUTES * 60_000 - Date.now()) / 1000))
    : 0;
  return json({
    active: Boolean(offer) && !offer!.redeemed_at && secondsLeft > 0,
    secondsLeft,
    bonusCoins: OFFER_BONUS_COINS,
  });
});
