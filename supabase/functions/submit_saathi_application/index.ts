// Stores a Saathi (mentor) application submitted from /saathi/apply.
// Runs as service role so the client never needs write access to
// saathi_applications or the saathi-photos bucket directly — see
// supabase/migrations/0004_saathi_applications.sql.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { handleCors, json } from "../_shared/cors.ts";

interface Photo {
  dataUrl: string; // "data:image/jpeg;base64,...."
}

interface Body {
  fullName?: string;
  displayName?: string;
  age?: number;
  cityState?: string;
  phone?: string;
  whatsappNumber?: string;
  email?: string;
  languages?: string[];
  languagesOther?: string;
  background?: string;
  backgroundOther?: string;
  experienceRange?: string;
  qualifications?: string;
  topics?: string[];
  topicsOther?: string;
  topicsAvoid?: string;
  bio?: string;
  modes?: string[];
  hoursPerWeek?: string;
  availabilityTimes?: string[];
  quietSpace?: string;
  heardAbout?: string;
  photos?: Photo[];
  confirmedAgeAndTrue?: boolean;
  confirmedIdCheck?: boolean;
  confirmedConductReview?: boolean;
  confirmedContactConsent?: boolean;
}

function decodeDataUrl(dataUrl: string): { bytes: Uint8Array; contentType: string } | null {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const [, contentType, base64] = match;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return { bytes, contentType };
}

Deno.serve(async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  const body = (await req.json()) as Body;

  const required: (keyof Body)[] = [
    "fullName",
    "displayName",
    "age",
    "cityState",
    "phone",
    "whatsappNumber",
    "email",
    "background",
    "experienceRange",
    "bio",
    "hoursPerWeek",
    "quietSpace",
  ];
  const missing = required.filter((k) => body[k] === undefined || body[k] === "");
  if (missing.length > 0) {
    return json({ error: `Missing required fields: ${missing.join(", ")}` }, { status: 400 });
  }
  if (!body.age || body.age < 18) {
    return json({ error: "You must be 18 or older to apply." }, { status: 400 });
  }
  if (
    !body.confirmedAgeAndTrue ||
    !body.confirmedIdCheck ||
    !body.confirmedConductReview ||
    !body.confirmedContactConsent
  ) {
    return json({ error: "All four confirmations are required." }, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const applicationId = crypto.randomUUID();
  const photoPaths: string[] = [];

  for (const [i, photo] of (body.photos ?? []).entries()) {
    const decoded = decodeDataUrl(photo.dataUrl);
    if (!decoded) continue;
    const ext = decoded.contentType === "image/png" ? "png" : "jpg";
    const path = `applications/${applicationId}/${i}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("saathi-photos")
      .upload(path, decoded.bytes, { contentType: decoded.contentType, upsert: true });
    if (!uploadError) photoPaths.push(path);
  }

  const { error: insertError } = await supabase.from("saathi_applications").insert({
    id: applicationId,
    full_name: body.fullName,
    display_name: body.displayName,
    age: body.age,
    city_state: body.cityState,
    phone: body.phone,
    whatsapp_number: body.whatsappNumber,
    email: body.email,
    languages: body.languages ?? [],
    languages_other: body.languagesOther || null,
    background: body.background,
    background_other: body.backgroundOther || null,
    experience_range: body.experienceRange,
    qualifications: body.qualifications || null,
    topics: body.topics ?? [],
    topics_other: body.topicsOther || null,
    topics_avoid: body.topicsAvoid || null,
    bio: body.bio,
    modes: body.modes ?? [],
    hours_per_week: body.hoursPerWeek,
    availability_times: body.availabilityTimes ?? [],
    quiet_space: body.quietSpace,
    heard_about: body.heardAbout || null,
    photo_paths: photoPaths,
    confirmed_age_and_true: body.confirmedAgeAndTrue,
    confirmed_id_check: body.confirmedIdCheck,
    confirmed_conduct_review: body.confirmedConductReview,
    confirmed_contact_consent: body.confirmedContactConsent,
  });

  if (insertError) {
    return json({ error: insertError.message }, { status: 500 });
  }

  return json({ ok: true, applicationId });
});
