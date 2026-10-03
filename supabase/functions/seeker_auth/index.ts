// Phone + 4-digit PIN accounts for seekers.
//   action "lookup": does an account exist for this phone? (routes the UI to
//                    "create PIN" vs "enter PIN")
//   action "signup": create the account (shadow auth user + profile + wallet
//                    + seeker_accounts row with a hashed PIN + generated
//                    username) and return the new user id.
//   action "login":  verify the PIN (5 wrong tries locks the account for
//                    15 minutes) and return the user id.
//
// Like the rest of this app's backend, the returned userId is what the
// client sends to other edge functions in place of a JWT — see the note in
// bootstrap_profile. This adds credentials to that model, not a session.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { handleCors, json } from "../_shared/cors.ts";
import { hashPin, newSalt, timingSafeEqual } from "../_shared/pin.ts";

const FREE_TRIAL_COINS = 60;
const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

const validPhone = (v: string) => /^[0-9]{10}$/.test(v);
const validPin = (v: unknown): v is string => typeof v === "string" && /^[0-9]{4}$/.test(v);

type AccountRow = {
  user_id: string;
  phone: string;
  username: string;
  age: number | null;
  pin_hash: string;
  pin_salt: string;
  failed_attempts: number;
  locked_until: string | null;
};

function publicAccount(row: Pick<AccountRow, "user_id" | "phone" | "username" | "age">) {
  return { userId: row.user_id, phone: row.phone, username: row.username, age: row.age };
}

Deno.serve(async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  const { action, pin, ...rest } = await req.json().catch(() => ({}));
  const phone = String(rest.phone ?? "").replace(/\D/g, "");
  if (!validPhone(phone)) {
    return json({ error: "Enter a valid 10-digit phone number." }, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: existing } = await supabase
    .from("seeker_accounts")
    .select("user_id, phone, username, age, pin_hash, pin_salt, failed_attempts, locked_until")
    .eq("phone", phone)
    .maybeSingle<AccountRow>();

  if (action === "lookup") {
    return json({ exists: Boolean(existing) });
  }

  if (!validPin(pin)) {
    return json({ error: "PIN must be exactly 4 digits." }, { status: 400 });
  }

  if (action === "login") {
    if (!existing) {
      return json({ error: "No account found for this number." }, { status: 404 });
    }
    if (existing.locked_until && new Date(existing.locked_until) > new Date()) {
      const minutes = Math.ceil((new Date(existing.locked_until).getTime() - Date.now()) / 60000);
      return json(
        { error: `Too many wrong PINs. Try again in ${minutes} min.`, locked: true },
        { status: 429 }
      );
    }

    const attempt = await hashPin(pin, existing.pin_salt);
    if (!timingSafeEqual(attempt, existing.pin_hash)) {
      const failed = existing.failed_attempts + 1;
      const lock = failed >= MAX_ATTEMPTS;
      await supabase
        .from("seeker_accounts")
        .update({
          failed_attempts: lock ? 0 : failed,
          locked_until: lock ? new Date(Date.now() + LOCK_MINUTES * 60000).toISOString() : null,
        })
        .eq("user_id", existing.user_id);
      return json(
        {
          error: lock
            ? `Too many wrong PINs. Try again in ${LOCK_MINUTES} min.`
            : `Wrong PIN. ${MAX_ATTEMPTS - failed} tries left.`,
          locked: lock,
        },
        { status: 401 }
      );
    }

    if (existing.failed_attempts > 0 || existing.locked_until) {
      await supabase
        .from("seeker_accounts")
        .update({ failed_attempts: 0, locked_until: null })
        .eq("user_id", existing.user_id);
    }
    return json(publicAccount(existing));
  }

  if (action === "signup") {
    if (existing) {
      return json({ error: "An account with this number already exists." }, { status: 409 });
    }

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: `seeker-${crypto.randomUUID()}@comfort-companion.local`,
      password: crypto.randomUUID(),
      email_confirm: true,
    });
    if (authError || !authUser?.user) {
      return json({ error: authError?.message ?? "Could not create account." }, { status: 500 });
    }
    const userId = authUser.user.id;

    // Roll the auth user back if any later step fails so a retry doesn't
    // leave orphaned shadow users behind.
    const rollback = () => supabase.auth.admin.deleteUser(userId);

    let username = "";
    const salt = newSalt();
    const pinHash = await hashPin(pin, salt);

    const { error: profileError } = await supabase
      .from("profiles")
      .insert({ id: userId, role: "seeker", display_name: "Seeker" });
    if (profileError) {
      await rollback();
      return json({ error: profileError.message }, { status: 500 });
    }

    // Username is generated; retry on the (unlikely) unique-constraint clash.
    let inserted: AccountRow | null = null;
    for (let i = 0; i < 5 && !inserted; i++) {
      username = `Seeker${Math.floor(1000 + Math.random() * 9000)}`;
      const { data, error } = await supabase
        .from("seeker_accounts")
        .insert({ user_id: userId, phone, pin_hash: pinHash, pin_salt: salt, username })
        .select("user_id, phone, username, age, pin_hash, pin_salt, failed_attempts, locked_until")
        .single<AccountRow>();
      if (data) inserted = data;
      else if (error?.code === "23505" && error.message.includes("phone")) {
        await rollback(); // lost a race with another signup for the same phone
        return json({ error: "An account with this number already exists." }, { status: 409 });
      } else if (error?.code !== "23505") {
        await rollback();
        return json({ error: error?.message ?? "Could not create account." }, { status: 500 });
      }
    }
    if (!inserted) {
      await rollback();
      return json({ error: "Could not create account. Please try again." }, { status: 500 });
    }

    await supabase.from("profiles").update({ display_name: username }).eq("id", userId);
    await supabase.from("wallets").insert({ user_id: userId, coin_balance: 0 });
    await supabase.rpc("increment_wallet_balance", { p_user_id: userId, p_amount: FREE_TRIAL_COINS });
    await supabase
      .from("coin_transactions")
      .insert({ user_id: userId, amount: FREE_TRIAL_COINS, type: "free_credit" });

    return json(publicAccount(inserted));
  }

  return json({ error: "Unknown action." }, { status: 400 });
});
