// A seeker sends a Saathi a gift during an active call.
//   { userId, sessionId, giftId } -> { coinBalance }
// The price comes from the server catalog, never from the client.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { handleCors, json } from "../_shared/cors.ts";
import { GIFTS, MENTOR_GIFT_SHARE_PCT } from "../_shared/gifts.ts";

Deno.serve(async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  const { userId, sessionId, giftId } = await req.json();
  const gift = GIFTS[giftId as string];
  if (!userId || !sessionId || !gift) {
    return json({ error: "userId, sessionId and a valid giftId are required." }, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: session } = await supabase
    .from("sessions")
    .select("id, seeker_id, mentor_id, status")
    .eq("id", sessionId)
    .eq("seeker_id", userId)
    .maybeSingle();
  if (!session) return json({ error: "Session not found." }, { status: 404 });
  if (session.status !== "active") {
    return json({ error: "Gifts can only be sent during a live call." }, { status: 409 });
  }

  const { data: newBalance, error } = await supabase.rpc("apply_gift", {
    p_session_id: sessionId,
    p_seeker_id: userId,
    p_mentor_id: session.mentor_id,
    p_gift_id: giftId,
    p_gift_name: gift.name,
    p_coins: gift.coins,
    p_mentor_coins: Math.floor((gift.coins * MENTOR_GIFT_SHARE_PCT) / 100),
  });
  if (error) return json({ error: "Couldn't send the gift." }, { status: 500 });
  if (newBalance === -1) return json({ error: "Not enough coins." }, { status: 402 });

  return json({ coinBalance: newBalance });
});
