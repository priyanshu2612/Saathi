// Creates a Cashfree order for a coin pack.
//   { userId, packId } -> { orderId, paymentSessionId, mode }
// The amount comes from the server's pack table, never from the client. The
// order tags carry user_id + pack_id so the webhook can credit the right
// wallet. Needs secrets CASHFREE_APP_ID, CASHFREE_SECRET_KEY and
// CASHFREE_ENV ("production" or "sandbox", default sandbox).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { handleCors, json } from "../_shared/cors.ts";
import { PACKS } from "../_shared/packs.ts";

Deno.serve(async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  const { userId, packId } = await req.json();
  const pack = PACKS[packId as string];
  if (!userId || !pack) {
    return json({ error: "userId and a valid packId are required." }, { status: 400 });
  }

  const appId = Deno.env.get("CASHFREE_APP_ID");
  const secretKey = Deno.env.get("CASHFREE_SECRET_KEY");
  if (!appId || !secretKey) {
    return json({ error: "Payments aren't set up yet." }, { status: 503 });
  }
  const mode = Deno.env.get("CASHFREE_ENV") === "production" ? "production" : "sandbox";
  const apiBase = mode === "production" ? "https://api.cashfree.com" : "https://sandbox.cashfree.com";

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const { data: account } = await supabase
    .from("seeker_accounts")
    .select("phone")
    .eq("user_id", userId)
    .maybeSingle();
  if (!account?.phone) {
    return json({ error: "Sign in again to add coins." }, { status: 400 });
  }

  const orderId = `sk_${packId}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
  const res = await fetch(`${apiBase}/pg/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-version": "2023-08-01",
      "x-client-id": appId,
      "x-client-secret": secretKey,
    },
    body: JSON.stringify({
      order_id: orderId,
      order_amount: pack.priceInr,
      order_currency: "INR",
      customer_details: { customer_id: String(userId).replace(/[^A-Za-z0-9_-]/g, "_"), customer_phone: account.phone },
      order_tags: { app: "sukoon", user_id: String(userId), pack_id: String(packId) },
    }),
  });
  if (!res.ok) return json({ error: "Couldn't start the payment." }, { status: 502 });

  const order = await res.json();
  return json({ orderId: order.order_id, paymentSessionId: order.payment_session_id, mode });
});
