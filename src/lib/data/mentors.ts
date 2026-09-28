import { supabase } from "@/lib/supabase/client";
import { Mentor, MoodTag } from "@/lib/types";

interface MentorProfileRow {
  user_id: string;
  bio: string;
  tags: string[];
  languages: string[];
  rate_chat: number;
  rate_audio: number | null;
  rate_video: number | null;
  photo_url: string | null;
  photos: string[];
  videos: string[];
  tagline: string;
  is_online: boolean;
  rating: number;
  session_count: number;
  boundaries: string[];
  response_rate_pct: number;
  tier: "standard" | "top_rated";
  popular: boolean;
  rising: boolean;
  age: number | null;
  gender: string | null;
  nationality: string | null;
  born_city: string | null;
  qualification: string | null;
  college: string | null;
  school: string | null;
  religion: string | null;
  communication_tags: string[];
  personality_tags: string[];
  profiles: { display_name: string } | { display_name: string }[] | null;
}

function mapMentorRow(row: MentorProfileRow): Mentor {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  const photos = row.photos?.length ? row.photos : row.photo_url ? [row.photo_url] : [];
  return {
    id: row.user_id,
    name: profile?.display_name ?? "Mentor",
    photoUrl: row.photo_url ?? photos[0] ?? "",
    photos,
    videos: row.videos ?? [],
    tagline: row.tagline ?? "",
    tags: (row.tags ?? []) as MoodTag[],
    languages: row.languages ?? [],
    bio: row.bio ?? "",
    rateChat: row.rate_chat,
    rateAudio: row.rate_audio ?? row.rate_chat,
    rateVideo: row.rate_video ?? row.rate_chat,
    rating: row.rating ?? 0,
    sessionCount: row.session_count ?? 0,
    isOnline: row.is_online,
    tier: row.tier ?? "standard",
    popular: row.popular ?? false,
    rising: row.rising ?? false,
    responseRatePct: row.response_rate_pct ?? 90,
    boundaries: row.boundaries ?? [],
    age: row.age ?? 0,
    gender: row.gender ?? "",
    nationality: row.nationality ?? "",
    bornCity: row.born_city ?? "",
    qualification: row.qualification ?? "",
    college: row.college ?? undefined,
    school: row.school ?? undefined,
    religion: row.religion ?? undefined,
    communicationTags: row.communication_tags ?? [],
    personalityTags: row.personality_tags ?? [],
  };
}

/** Public mentor browse list — reads mentor_profiles directly via the anon key; RLS only exposes approved rows. */
export async function fetchMentors(): Promise<Mentor[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("mentor_profiles")
    .select(
      "user_id, bio, tags, languages, rate_chat, rate_audio, rate_video, photo_url, photos, videos, tagline, is_online, rating, session_count, boundaries, response_rate_pct, tier, popular, rising, age, gender, nationality, born_city, qualification, college, school, religion, communication_tags, personality_tags, profiles(display_name)"
    )
    .eq("verification_status", "approved");

  if (error || !data) return [];
  return (data as unknown as MentorProfileRow[]).map(mapMentorRow);
}
