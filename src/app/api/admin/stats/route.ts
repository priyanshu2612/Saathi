import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";
import { adminSupabase } from "@/lib/admin/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const raw = Number(req.nextUrl.searchParams.get("days") ?? 30);
  const days = Number.isFinite(raw) ? Math.min(Math.max(Math.round(raw), 1), 365) : 30;

  const { data, error } = await adminSupabase().rpc("admin_dashboard", { p_days: days });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
