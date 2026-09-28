// Atomically claims a mentor_invites row: creates a shadow auth user (see
// bootstrap_profile/index.ts for why — auth is mocked, but profiles.id
// still needs a matching auth.users row), the profiles row, and a
// mentor_profiles row pre-filled from the invite.
// Never let the client write mentor_profiles directly from a code — that
// would let anyone forge a "pre-approved" mentor row.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { handleCors, json } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  const { accessCode, phone } = await req.json();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: invite, error: inviteError } = await supabase
    .from("mentor_invites")
    .select("*")
    .eq("access_code", accessCode)
    .single();

  if (inviteError || !invite || invite.status !== "unclaimed") {
    return json({ error: "This code isn't valid or has already been used." }, { status: 400 });
  }

  // Older invites (or ones an admin didn't pin to a phone) skip this check —
  // only enforced when the invite itself carries a phone number.
  if (invite.phone && invite.phone !== phone) {
    return json(
      { error: "This code isn't linked to that phone number. Double-check and try again." },
      { status: 400 }
    );
  }

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

  await supabase.from("profiles").insert({
    id: userId,
    role: "mentor",
    display_name: invite.prefill_name ?? "New mentor",
  });

  await supabase.from("mentor_profiles").insert({
    user_id: userId,
    bio: invite.prefill_bio ?? "",
    tags: invite.prefill_tags ?? [],
    languages: invite.prefill_languages ?? [],
    photo_url: invite.prefill_photos?.[0] ?? null,
    photos: invite.prefill_photos ?? [],
    verification_status: "approved",
  });

  await supabase.from("wallets").insert({ user_id: userId, coin_balance: 0 });

  await supabase
    .from("mentor_invites")
    .update({ status: "claimed", claimed_by_user_id: userId })
    .eq("id", invite.id);

  return json({ userId, name: invite.prefill_name ?? null });
});
