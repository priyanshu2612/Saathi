// Creates a Razorpay order for a coin pack.
//   { userId, packId } -> { orderId, amount, currency, keyId }
// The amount comes from the server's pack table, never from the client. The
// order notes carry user_id + pack_id so the webhook can credit the right
// wallet. Needs secrets RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.

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

  const keyId = Deno.env.get("RAZORPAY_KEY_ID");
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
  if (!keyId || !keySecret) {
    return json({ error: "Payments aren't set up yet." }, { status: 503 });
  }

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
    },
    body: JSON.stringify({
      amount: pack.priceInr * 100, // paise
      currency: "INR",
      receipt: `${packId}-${Date.now()}`.slice(0, 40),
      notes: { user_id: userId, pack_id: packId },
    }),
  });
  if (!res.ok) return json({ error: "Couldn't start the payment." }, { status: 502 });

  const order = await res.json();
  return json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId });
});
