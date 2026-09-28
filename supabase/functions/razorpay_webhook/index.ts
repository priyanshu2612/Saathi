// Coins are credited ONLY from here — a verified Razorpay webhook — never
// from the client confirming "payment succeeded." Set the webhook secret in
// Razorpay's dashboard and as a Supabase function secret (RAZORPAY_WEBHOOK_SECRET).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { createHmac } from "node:crypto";

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
  const userId = payment.notes?.user_id;
  const coins = Number(payment.notes?.coins);

  if (!userId || !coins) {
    return Response.json({ error: "Missing user_id/coins in payment notes" }, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  await supabase.from("coin_transactions").insert({
    user_id: userId,
    amount: coins,
    type: "purchase",
  });

  await supabase.rpc("increment_wallet_balance", { p_user_id: userId, p_amount: coins });

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
