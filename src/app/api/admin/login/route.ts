import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  adminConfigured,
  clearFailures,
  createSessionToken,
  isBlocked,
  passwordMatches,
  recordFailure,
} from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!adminConfigured()) {
    return NextResponse.json(
      { error: "Admin isn't configured. Set ADMIN_PASSWORD and SUPABASE_SERVICE_ROLE_KEY." },
      { status: 503 }
    );
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isBlocked(ip)) {
    return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
  }

  const { password } = await req.json().catch(() => ({ password: "" }));
  // Constant small delay so guessing is slow even before the lockout kicks in.
  await new Promise((r) => setTimeout(r, 600));

  if (typeof password !== "string" || !passwordMatches(password)) {
    recordFailure(ip);
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  clearFailures(ip);
  const session = createSessionToken();
  if (!session) return NextResponse.json({ error: "Admin isn't configured." }, { status: 503 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: session.maxAge,
  });
  return res;
}
