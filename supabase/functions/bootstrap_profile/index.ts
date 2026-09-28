// Auth is intentionally mocked in this app (phone OTP is a UI-only stub —
// see src/lib/store.tsx): there's no SMS provider wired up, so the client
// never gets a real Supabase session/JWT. profiles.id still has a foreign
// key to auth.users though, so this function creates a throwaway "shadow"
// auth user (synthetic email, random password, never given to the client)
// the first time a device needs an account, then inserts the matching
// profiles + wallets rows. The generated id is returned once and the client
// persists it (see src/lib/data/backend.ts) — that id is used on every
// later call instead of a real access token.
//
// This is a stand-in for real auth, not a security model: anyone who
// obtains a stored device id could act as that account through the other
// edge functions. Don't ship this pattern once real auth (OTP/SMS) exists.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { handleCors, json } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  const { role, displayName } = await req.json();

  if (!["seeker", "mentor"].includes(role)) {
    return json({ error: "A valid role is required." }, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const shadowEmail = `device-${crypto.randomUUID()}@comfort-companion.local`;
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: shadowEmail,
    password: crypto.randomUUID(),
    email_confirm: true,
  });

  if (authError || !authUser?.user) {
    return json({ error: authError?.message ?? "Could not create account." }, { status: 500 });
  }

  const userId = authUser.user.id;

  const { error: profileError } = await supabase.from("profiles").insert({
    id: userId,
    role,
    display_name: displayName ?? "New user",
  });
  if (profileError) {
    return json({ error: profileError.message }, { status: 500 });
  }

  const { error: walletError } = await supabase
    .from("wallets")
    .insert({ user_id: userId, coin_balance: 0 });
  if (walletError) {
    return json({ error: walletError.message }, { status: 500 });
  }

  return json({ userId });
});
