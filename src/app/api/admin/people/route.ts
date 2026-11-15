import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";
import { adminSupabase } from "@/lib/admin/supabase";

export const dynamic = "force-dynamic";

const BUCKET = "saathi-photos";
const SIGNED_SECONDS = 60 * 60;
const isDirect = (s: string) => /^(https?:|data:)/i.test(s);

type Row = Record<string, unknown> & {
  photo_paths?: string[];
  photo_url?: string | null;
  photos?: string[] | null;
  application_id?: string | null;
};

export async function GET() {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = adminSupabase();
  const { data, error } = await sb.rpc("admin_people");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const users = (data?.users ?? []) as Row[];
  const saathi = (data?.saathi ?? []) as Row[];
  const applicants = (data?.applicants ?? []) as Row[];

  // Private storage paths (application photos, or any non-URL value) need
  // short-lived signed links so the browser can display them.
  const paths = new Set<string>();
  for (const a of applicants) (a.photo_paths ?? []).forEach((p) => paths.add(p));
  for (const m of saathi) {
    [m.photo_url, ...(m.photos ?? [])].forEach((p) => {
      if (p && !isDirect(p)) paths.add(p);
    });
  }

  const signed = new Map<string, string>();
  if (paths.size > 0) {
    const { data: urls } = await sb.storage.from(BUCKET).createSignedUrls([...paths], SIGNED_SECONDS);
    for (const u of urls ?? []) if (u.path && u.signedUrl) signed.set(u.path, u.signedUrl);
  }
  const resolve = (p: string | null | undefined) =>
    p ? (isDirect(p) ? p : signed.get(p) ?? null) : null;
  const resolveAll = (list: (string | null | undefined)[]) => {
    const out: string[] = [];
    for (const p of list) {
      const url = resolve(p);
      if (url && !out.includes(url)) out.push(url);
    }
    return out;
  };

  const appPhotos = new Map<string, string[]>();
  for (const a of applicants) appPhotos.set(a.id as string, resolveAll(a.photo_paths ?? []));

  const saathiOut = saathi.map((m) => ({
    ...m,
    photos: resolveAll([m.photo_url, ...(m.photos ?? [])]),
    application_photos: m.application_id ? appPhotos.get(m.application_id) ?? [] : [],
  }));
  const applicantOut = applicants.map((a) => ({
    ...a,
    photo_paths: undefined,
    photos: appPhotos.get(a.id as string) ?? [],
  }));

  return NextResponse.json(
    { users, saathi: saathiOut, applicants: applicantOut, generated_at: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
