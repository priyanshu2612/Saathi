import { supabase } from "@/lib/supabase/client";
import { CoinTransaction, MoodTag, SessionMode, SessionRecord } from "@/lib/types";
import type { MentorProfileDraft } from "@/lib/store";

const SEEKER_ID_KEY = "comfort-companion-seeker-id";
const MENTOR_ID_KEY = "comfort-companion-mentor-id";

function getStoredId(key: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

function setStoredId(key: string, id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, id);
}

export function getSeekerId() {
  return getStoredId(SEEKER_ID_KEY);
}

export function getMentorId() {
  return getStoredId(MENTOR_ID_KEY);
}

async function invoke<T>(name: string, body: Record<string, unknown>): Promise<T> {
  if (!supabase) throw new Error("Supabase client is not configured.");
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as T;
}

// Guards against two concurrent callers (e.g. React StrictMode's double
// effect-invocation in dev) both seeing no stored id and each bootstrapping
// their own shadow account before either write lands in localStorage.
let inFlightBootstrap: Promise<string> | null = null;

/** Ensures a shadow account exists for this device's seeker identity, creating one on first use. */
export async function ensureSeekerId(displayName?: string): Promise<string> {
  const existing = getSeekerId();
  if (existing) return existing;
  if (inFlightBootstrap) return inFlightBootstrap;

  inFlightBootstrap = invoke<{ userId: string }>("bootstrap_profile", {
    role: "seeker",
    displayName,
  })
    .then(({ userId }) => {
      setStoredId(SEEKER_ID_KEY, userId);
      return userId;
    })
    .finally(() => {
      inFlightBootstrap = null;
    });

  return inFlightBootstrap;
}

export async function claimMentorInvite(
  accessCode: string,
  phone?: string
): Promise<{ ok: boolean; name?: string; error?: string }> {
  try {
    const { userId, name } = await invoke<{ userId: string; name: string | null }>(
      "claim_mentor_invite",
      { accessCode, phone }
    );
    setStoredId(MENTOR_ID_KEY, userId);
    return { ok: true, name: name ?? undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not claim invite." };
  }
}

export interface SaathiApplicationDraft {
  fullName: string;
  displayName: string;
  age: number;
  cityState: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  languages: string[];
  languagesOther: string;
  background: string;
  backgroundOther: string;
  experienceRange: string;
  qualifications: string;
  topics: string[];
  topicsOther: string;
  topicsAvoid: string;
  bio: string;
  modes: string[];
  hoursPerWeek: string;
  availabilityTimes: string[];
  quietSpace: string;
  heardAbout: string;
  photos: string[]; // data URLs
  confirmedAgeAndTrue: boolean;
  confirmedIdCheck: boolean;
  confirmedConductReview: boolean;
  confirmedContactConsent: boolean;
}

export async function submitSaathiApplication(
  draft: SaathiApplicationDraft
): Promise<{ ok: boolean; error?: string }> {
  try {
    await invoke("submit_saathi_application", {
      ...draft,
      photos: draft.photos.map((dataUrl) => ({ dataUrl })),
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not submit your application.",
    };
  }
}

export async function startSessionRemote(
  seekerId: string,
  mentorId: string,
  mode: SessionMode
): Promise<SessionRecord | null> {
  try {
    const { session } = await invoke<{
      session: {
        id: string;
        mentor_id: string;
        mode: SessionMode;
        started_at: string;
        rate_per_minute: number;
        total_coins_charged: number;
        status: string;
      };
    }>("start_session", { seekerId, mentorId, mode });
    return {
      id: session.id,
      mentorId: session.mentor_id,
      mode: session.mode,
      startedAt: session.started_at,
      status: "active",
      totalCoinsCharged: session.total_coins_charged,
      ratePerMinute: session.rate_per_minute,
    };
  } catch {
    return null;
  }
}

export async function sessionTick(
  sessionId: string
): Promise<{ ended: boolean; coinsCharged: number; coinBalance: number }> {
  return invoke("session_tick", { sessionId });
}

export async function endSessionRemote(sessionId: string): Promise<void> {
  await invoke("end_session", { sessionId });
}

export async function getAccount(
  userId: string
): Promise<{ coinBalance: number; transactions: CoinTransaction[]; sessions: SessionRecord[] }> {
  const data = await invoke<{
    coinBalance: number;
    transactions: {
      id: string;
      amount: number;
      type: CoinTransaction["type"];
      related_session_id: string | null;
      created_at: string;
    }[];
    sessions: {
      id: string;
      mentor_id: string;
      seeker_id: string;
      mode: SessionMode;
      started_at: string;
      ended_at: string | null;
      total_coins_charged: number;
      status: string;
      rate_per_minute: number;
    }[];
  }>("get_account", { userId });

  return {
    coinBalance: data.coinBalance,
    transactions: data.transactions.map((t) => ({
      id: t.id,
      amount: t.amount,
      type: t.type,
      createdAt: t.created_at,
      relatedSessionId: t.related_session_id ?? undefined,
    })),
    sessions: data.sessions.map((s) => ({
      id: s.id,
      mentorId: s.mentor_id,
      mode: s.mode,
      startedAt: s.started_at,
      endedAt: s.ended_at ?? undefined,
      status: s.status === "completed" ? "completed" : "active",
      totalCoinsCharged: s.total_coins_charged,
      ratePerMinute: s.rate_per_minute,
    })),
  };
}

const PROFILE_FIELD_MAP: Record<keyof MentorProfileDraft, string> = {
  name: "", // display_name lives on `profiles`, not editable here yet
  tagline: "tagline",
  bio: "bio",
  tags: "tags",
  languages: "languages",
  rateChat: "rate_chat",
  rateAudio: "rate_audio",
  rateVideo: "rate_video",
  photoUrl: "photo_url",
  photos: "photos",
  age: "age",
  gender: "gender",
  nationality: "nationality",
  bornCity: "born_city",
  qualification: "qualification",
  college: "college",
  school: "school",
  religion: "religion",
  communicationTags: "communication_tags",
  personalityTags: "personality_tags",
};

export async function updateMentorProfileRemote(
  userId: string,
  draft: Partial<MentorProfileDraft>
): Promise<void> {
  const fields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(draft)) {
    const column = PROFILE_FIELD_MAP[key as keyof MentorProfileDraft];
    if (column) fields[column] = value;
  }
  if (Object.keys(fields).length === 0) return;
  await invoke("update_mentor_profile", { userId, fields });
}

export async function setMentorOnlineRemote(userId: string, online: boolean): Promise<void> {
  await invoke("update_mentor_profile", { userId, fields: { is_online: online } });
}

export type { MoodTag };
