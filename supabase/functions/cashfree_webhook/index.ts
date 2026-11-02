// Coins are credited ONLY from here — a verified Cashfree webhook — never
// from the client confirming "payment succeeded." Point Cashfree's webhook
// (Payment Gateway -> Developers -> Webhooks) at this function. Verification
// uses CASHFREE_SECRET_KEY, the same secret used to create orders.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { createHmac } from "node:crypto";
import { FIRST_RECHARGE_BONUS_PCT, PACKS } from "../_shared/packs.ts";

Deno.serve(async (req) => {
  const rawBody = await req.text();
  const signature = req.headers.get("x-webhook-signature");
  const timestamp = req.headers.get("x-webhook-timestamp");
  const secret = Deno.env.get("CASHFREE_SECRET_KEY")!;

  const expectedSignature = createHmac("sha256", secret)
    .update((timestamp ?? "") + rawBody)
    .digest("base64");
  if (!signature || !timestamp || signature !== expectedSignature) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  if (payload.type !== "PAYMENT_SUCCESS_WEBHOOK") {
    return Response.json({ ignored: true });
  }

  const { order, payment } = payload.data;
  // This Cashfree account may also serve other apps; their payments reach
  // this webhook too. Acknowledge (so Cashfree doesn't retry) and ignore.
  if (order.order_tags?.app !== "sukoon") {
    return Response.json({ ignored: true });
  }
  // Tags were set server-side by create_order; the pack table, not the
  // tags, decides how many coins this payment is worth.
  const userId = order.order_tags?.user_id;
  const pack = PACKS[order.order_tags?.pack_id as string];

  if (!userId || !pack) {
    return Response.json({ error: "Missing user_id/pack_id in order tags" }, { status: 400 });
  }
  if (Number(payment.payment_amount) !== pack.priceInr) {
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
    cashfree_payment_id: String(payment.cf_payment_id),
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
