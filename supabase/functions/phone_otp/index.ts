// SMS OTP for phone verification, sent through MSG91.
//   { action: "send",   phone }        -> { ok: true }
//   { action: "verify", phone, code }  -> { ok: true }
//
// We generate the code ourselves, store only a salted hash, and ask MSG91 to
// deliver it (MSG91's "otp" parameter). A successful verify just marks the
// phone as verified for 15 minutes; seeker_auth checks that when creating the
// account. Needs secrets MSG91_AUTH_KEY and MSG91_TEMPLATE_ID (a DLT-approved
// template containing the ##OTP## variable).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { handleCors, json } from "../_shared/cors.ts";
import { hashPin, newSalt, timingSafeEqual } from "../_shared/pin.ts";

const CODE_MINUTES = 10;
const MAX_VERIFY_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 30;
const MAX_SENDS_PER_PHONE = 3; // per 10 minutes
const MAX_SENDS_PER_IP = 10; // per hour
const MAX_SENDS_GLOBAL = 500; // per hour

const validPhone = (v: string) => /^[0-9]{10}$/.test(v);

function newCode(): string {
  // Uniform 6-digit code (rejection sampling avoids modulo bias).
  const buf = new Uint32Array(1);
  const limit = Math.floor(0xffffffff / 1_000_000) * 1_000_000;
  do crypto.getRandomValues(buf);
  while (buf[0] >= limit);
  return String(buf[0] % 1_000_000).padStart(6, "0");
}

Deno.serve(async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  const { action, code, ...rest } = await req.json().catch(() => ({}));
  const phone = String(rest.phone ?? "").replace(/\D/g, "");
  if (!validPhone(phone)) {
    return json({ error: "Enter a valid 10-digit phone number." }, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  if (action === "send") {
    const authKey = Deno.env.get("MSG91_AUTH_KEY");
    const templateId = Deno.env.get("MSG91_TEMPLATE_ID");
    if (!authKey || !templateId) {
      return json({ error: "SMS verification isn't set up yet." }, { status: 503 });
    }

    // OTPs are only for creating new accounts — existing numbers sign in with their PIN.
    const { data: account } = await supabase
      .from("seeker_accounts")
      .select("user_id")
      .eq("phone", phone)
      .maybeSingle();
    if (account) {
      return json({ error: "An account with this number already exists." }, { status: 409 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null;
    const since = (ms: number) => new Date(Date.now() - ms).toISOString();
    const sends = () => supabase.from("phone_otp_sends");

    const [phoneSends, ipSends, globalSends, last] = await Promise.all([
      sends().select("id", { count: "exact", head: true }).eq("phone", phone).gte("created_at", since(10 * 60_000)),
      ip
        ? sends().select("id", { count: "exact", head: true }).eq("ip", ip).gte("created_at", since(60 * 60_000))
        : Promise.resolve({ count: 0 }),
      sends().select("id", { count: "exact", head: true }).gte("created_at", since(60 * 60_000)),
      sends().select("created_at").eq("phone", phone).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    const perPhone = phoneSends.count ?? 0;
    const perIp = ipSends.count ?? 0;
    const global = globalSends.count ?? 0;

    if (global >= MAX_SENDS_GLOBAL) {
      return json({ error: "We're getting a lot of requests. Please try again later." }, { status: 429 });
    }
    if (perPhone >= MAX_SENDS_PER_PHONE || perIp >= MAX_SENDS_PER_IP) {
      return json({ error: "Too many codes requested. Please try again in a few minutes." }, { status: 429 });
    }
    if (last.data && Date.now() - new Date(last.data.created_at).getTime() < RESEND_COOLDOWN_SECONDS * 1000) {
      return json({ error: "Please wait a few seconds before asking for another code." }, { status: 429 });
    }

    const otp = newCode();
    const salt = newSalt();
    const { error: storeError } = await supabase.from("phone_otps").upsert({
      phone,
      code_hash: await hashPin(otp, salt),
      code_salt: salt,
      expires_at: new Date(Date.now() + CODE_MINUTES * 60_000).toISOString(),
      attempts: 0,
      verified_at: null,
      created_at: new Date().toISOString(),
    });
    if (storeError) return json({ error: "Couldn't send the code. Please try again." }, { status: 500 });

    await supabase.from("phone_otp_sends").insert({ phone, ip });

    const url = new URL("https://control.msg91.com/api/v5/otp");
    url.searchParams.set("template_id", templateId);
    url.searchParams.set("mobile", `91${phone}`);
    url.searchParams.set("authkey", authKey);
    url.searchParams.set("otp", otp);
    url.searchParams.set("otp_expiry", String(CODE_MINUTES));
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" } });
    const result = await res.json().catch(() => ({}));
    if (!res.ok || result.type === "error") {
      console.error("MSG91 send failed", res.status, JSON.stringify(result));
      return json({ error: "Couldn't send the SMS. Please try again." }, { status: 502 });
    }
    return json({ ok: true });
  }

  if (action === "verify") {
    if (typeof code !== "string" || !/^[0-9]{6}$/.test(code)) {
      return json({ error: "Enter the 6-digit code." }, { status: 400 });
    }
    const { data: row } = await supabase
      .from("phone_otps")
      .select("code_hash, code_salt, expires_at, attempts")
      .eq("phone", phone)
      .maybeSingle();

    if (!row || new Date(row.expires_at) < new Date()) {
      return json({ error: "That code has expired. Ask for a new one." }, { status: 400 });
    }
    if (row.attempts >= MAX_VERIFY_ATTEMPTS) {
      return json({ error: "Too many wrong tries. Ask for a new code." }, { status: 429 });
    }

    const attempt = await hashPin(code, row.code_salt);
    if (!timingSafeEqual(attempt, row.code_hash)) {
      await supabase.from("phone_otps").update({ attempts: row.attempts + 1 }).eq("phone", phone);
      const left = MAX_VERIFY_ATTEMPTS - row.attempts - 1;
      return json(
        { error: left > 0 ? `Wrong code. ${left} tries left.` : "Too many wrong tries. Ask for a new code." },
        { status: 401 }
      );
    }

    await supabase.from("phone_otps").update({ verified_at: new Date().toISOString() }).eq("phone", phone);
    return json({ ok: true });
  }

  return json({ error: "Unknown action." }, { status: 400 });
});
