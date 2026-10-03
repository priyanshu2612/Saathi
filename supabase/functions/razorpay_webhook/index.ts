// Coins are credited ONLY from here — a verified Razorpay webhook — never
// from the client confirming "payment succeeded." Set the webhook secret in
// Razorpay's dashboard and as a Supabase function secret (RAZORPAY_WEBHOOK_SECRET).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { createHmac } from "node:crypto";
import { FIRST_RECHARGE_BONUS_PCT, PACKS } from "../_shared/packs.ts";

Deno.serve(async (req) => {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  const secret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET")!;

  const expectedSignature = createHmac("sha256", secret).update(rawBody).digest("hex");
  if (!signature || signature !== expectedSignature) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  if (payload.event !== "payment.captured") {
    return Response.json({ ignored: true });
  }

  const payment = payload.payload.payment.entity;
  // Notes were set server-side by create_order; the pack table, not the
  // notes, decides how many coins this payment is worth.
  const userId = payment.notes?.user_id;
  const pack = PACKS[payment.notes?.pack_id as string];

  if (!userId || !pack) {
    return Response.json({ error: "Missing user_id/pack_id in payment notes" }, { status: 400 });
  }
  if (payment.amount !== pack.priceInr * 100) {
    return Response.json({ error: "Amount doesn't match the pack" }, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // First purchase gets the one-time bonus.
  const { count } = await supabase
    .from("coin_transactions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("type", "purchase");
  const bonus = count === 0 ? Math.round((pack.coins * FIRST_RECHARGE_BONUS_PCT) / 100) : 0;

  // The unique payment id makes a redelivered webhook a no-op.
  const { error: insertError } = await supabase.from("coin_transactions").insert({
    user_id: userId,
    amount: pack.coins,
    type: "purchase",
    razorpay_payment_id: payment.id,
  });
  if (insertError) return Response.json({ ok: true, duplicate: true });

  if (bonus > 0) {
    await supabase.from("coin_transactions").insert({
      user_id: userId,
      amount: bonus,
      type: "bonus",
      description: "First-recharge bonus",
    });
  }

  await supabase.rpc("increment_wallet_balance", {
    p_user_id: userId,
    p_amount: pack.coins + bonus,
  });

  return Response.json({ ok: true });
});

/*
Companion SQL function:

create or replace function increment_wallet_balance(p_user_id uuid, p_amount int)
returns void as $$
begin
  insert into wallets (user_id, coin_balance)
  values (p_user_id, p_amount)
  on conflict (user_id) do update
    set coin_balance = wallets.coin_balance + p_amount, updated_at = now();
end;
$$ language plpgsql security definer;
*/
