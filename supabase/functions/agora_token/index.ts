// Mints an Agora RTC token for one participant of an active call. The
// channel name is derived from the session id, and uids are fixed per role
// (seeker = 1, mentor = 2), so only the two people on the session can join.
//
// Needs function secrets: AGORA_APP_ID, AGORA_APP_CERTIFICATE.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { RtcRole, RtcTokenBuilder } from "npm:agora-token@2.0.5";
import { handleCors, json } from "../_shared/cors.ts";

const TOKEN_TTL_SECONDS = 2 * 60 * 60;

Deno.serve(async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  const appId = Deno.env.get("AGORA_APP_ID");
  const certificate = Deno.env.get("AGORA_APP_CERTIFICATE");
  if (!appId || !certificate) {
    return json({ error: "Video calling isn't configured on the server yet." }, { status: 500 });
  }

  const { userId, sessionId } = await req.json();
  if (!userId || !sessionId) {
    return json({ error: "userId and sessionId are required." }, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: session } = await supabase
    .from("sessions")
    .select("id, seeker_id, mentor_id, status, mode")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session || (session.seeker_id !== userId && session.mentor_id !== userId)) {
    return json({ error: "Session not found." }, { status: 404 });
  }
  if (session.status !== "active" || session.mode !== "video") {
    return json({ error: "This call isn't active." }, { status: 409 });
  }

  const uid = session.seeker_id === userId ? 1 : 2;
  const channel = `session-${session.id}`;
  const expiresAt = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    certificate,
    channel,
    uid,
    RtcRole.PUBLISHER,
    expiresAt,
    expiresAt
  );

  return json({ appId, channel, token, uid });
});
