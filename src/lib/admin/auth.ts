import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// Single-owner admin auth: one password (ADMIN_PASSWORD, set in Vercel) is
// exchanged for a signed, HttpOnly, 30-day cookie. Changing the password
// invalidates every existing session.

export const ADMIN_COOKIE = "sukoon_admin";
const TTL_SECONDS = 30 * 24 * 60 * 60;

function signingKey(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return `${password}::${process.env.ADMIN_SESSION_SECRET ?? ""}`;
}

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function passwordMatches(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return safeEqual(input, expected);
}

export function createSessionToken(): { token: string; maxAge: number } | null {
  const key = signingKey();
  if (!key) return null;
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  return { token: `${exp}.${sign(`v1.${exp}`, key)}`, maxAge: TTL_SECONDS };
}

export function isAdmin(): boolean {
  const key = signingKey();
  if (!key) return false;
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || !/^\d+$/.test(exp)) return false;
  if (Number(exp) < Date.now() / 1000) return false;
  return safeEqual(sig, sign(`v1.${exp}`, key));
}

// Best-effort brute-force guard (per serverless instance). The password is
// the real protection; this just slows guessing down.
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

export function isBlocked(ip: string): boolean {
  const entry = attempts.get(ip);
  if (!entry) return false;
  if (entry.resetAt < Date.now()) {
    attempts.delete(ip);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

export function recordFailure(ip: string) {
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < Date.now()) {
    attempts.set(ip, { count: 1, resetAt: Date.now() + WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

export function clearFailures(ip: string) {
  attempts.delete(ip);
}
