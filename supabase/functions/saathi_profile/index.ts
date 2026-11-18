// The signed-in Saathi's own profile, assembled from what they filled in on
// their application plus their login code and call rates.
//   { mentorId } -> { profile }
// Applications are matched to the Saathi through the invite they claimed
// (invites are pinned to the applicant's phone number). Application photos
// live in a private bucket, so they're returned as short-lived signed links.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { handleCors, json } from "../_shared/cors.ts";

const BUCKET = "saathi-photos";
const SIGNED_SECONDS = 60 * 60;
const isDirect = (s: string) => /^(https?:|data:)/i.test(s);

Deno.serve(async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  const { mentorId } = await req.json().catch(() => ({}));
  if (!mentorId) return json({ error: "mentorId is required." }, { status: 400 });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const [{ data: mp }, { data: prof }, { data: invite }] = await Promise.all([
    supabase
      .from("mentor_profiles")
      .select("rate_audio, rate_video, photo_url, photos, languages, tags, age")
      .eq("user_id", mentorId)
      .maybeSingle(),
    supabase.from("profiles").select("display_name").eq("id", mentorId).maybeSingle(),
    supabase
      .from("mentor_invites")
      .select("access_code, phone")
      .eq("claimed_by_user_id", mentorId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (!mp) return json({ error: "Saathi not found." }, { status: 404 });

  const phone10 = (invite?.phone ?? "").replace(/\D/g, "").slice(-10);
  const { data: app } = phone10
    ? await supabase
        .from("saathi_applications")
        .select(
          "full_name, age, phone, languages, languages_other, profession, topics, modes, photo_paths"
        )
        .like("phone", `%${phone10}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  // Photos: the application's own photos first, else whatever is on the profile.
  const rawPhotos: string[] = app?.photo_paths?.length
    ? app.photo_paths
    : [mp.photo_url, ...(mp.photos ?? [])].filter((p): p is string => Boolean(p));
  const toSign = [...new Set(rawPhotos.filter((p) => !isDirect(p)))];
  const signed = new Map<string, string>();
  if (toSign.length > 0) {
    const { data: urls } = await supabase.storage.from(BUCKET).createSignedUrls(toSign, SIGNED_SECONDS);
    for (const u of urls ?? []) if (u.path && u.signedUrl) signed.set(u.path, u.signedUrl);
  }
  const photos = [
    ...new Set(
      rawPhotos
        .map((p) => (isDirect(p) ? p : signed.get(p)))
        .filter((u): u is string => Boolean(u))
    ),
  ];

  const languages = [
    ...(app?.languages ?? mp.languages ?? []),
    ...(app?.languages_other
      ? String(app.languages_other).split(/[,/]/).map((l: string) => l.trim()).filter(Boolean)
      : []),
  ];

  return json({
    profile: {
      name: (app?.full_name ?? prof?.display_name ?? "Saathi").trim(),
      phone: app?.phone ?? invite?.phone ?? null,
      loginCode: invite?.access_code ?? null,
      age: app?.age ?? mp.age ?? null,
      profession: app?.profession ?? null,
      topics: app?.topics ?? mp.tags ?? [],
      languages,
      modes: app?.modes ?? [],
      photos,
      rateAudio: mp.rate_audio ?? null,
      rateVideo: mp.rate_video ?? null,
    },
  });
});
