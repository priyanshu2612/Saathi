import { supabase } from "@/lib/supabase/client";
import {
  CoinTransaction,
  MoodTag,
  SessionMode,
  SessionRecord,
  TopicCategory,
} from "@/lib/types";
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

export function setSeekerId(id: string | null) {
  if (typeof window === "undefined") return;
  if (id) window.localStorage.setItem(SEEKER_ID_KEY, id);
  else window.localStorage.removeItem(SEEKER_ID_KEY);
}

export function getMentorId() {
  return getStoredId(MENTOR_ID_KEY);
}

async function invoke<T>(name: string, body: Record<string, unknown>): Promise<T> {
  if (!supabase) throw new Error("Supabase client is not configured.");
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    // Non-2xx responses surface as a generic FunctionsHttpError; the useful
    // message (e.g. "Wrong PIN. 4 tries left.") is in the response body.
    const res = (error as { context?: Response }).context;
    let message: string | undefined;
    if (res && typeof res.json === "function") {
      message = await res.json().then((b: { error?: string }) => b?.error).catch(() => undefined);
    }
    throw message ? new Error(message) : error;
  }
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

export interface SeekerAccount {
  userId: string;
  phone: string;
  username: string;
  age: number | null;
}

export async function seekerLookup(phone: string): Promise<boolean> {
  const { exists } = await invoke<{ exists: boolean }>("seeker_auth", { action: "lookup", phone });
  return exists;
}

export async function seekerSignUp(phone: string, pin: string): Promise<SeekerAccount> {
  return invoke<SeekerAccount>("seeker_auth", { action: "signup", phone, pin });
}

export async function seekerLogIn(phone: string, pin: string): Promise<SeekerAccount> {
  return invoke<SeekerAccount>("seeker_auth", { action: "login", phone, pin });
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
  age: number;
  cityState: string;
  phone: string;
  whatsappNumber: string;
  languages: string[];
  languagesOther: string;
  profession: string;
  topics: string[];
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
      status: session.status === "ringing" ? "ringing" : "active",
      totalCoinsCharged: session.total_coins_charged,
      ratePerMinute: session.rate_per_minute,
    };
  } catch {
    return null;
  }
}

export interface PolledGift {
  id: string;
  giftId: string;
  giftName: string;
  mentorCoins: number;
  createdAt: string;
}

export interface CallPollSession {
  id: string;
  status: string;
  gifts?: PolledGift[];
  startedAt: string;
  topicCategory: TopicCategory | null;
  topic: string | null;
  seekerName?: string;
}

export interface IncomingCall {
  id: string;
  mode: SessionMode;
  startedAt: string;
  topicCategory: TopicCategory | null;
  topic: string | null;
  seekerName: string;
}

export async function pollSeekerCall(userId: string, sessionId: string): Promise<CallPollSession> {
  const { session } = await invoke<{ session: CallPollSession }>("call_poll", {
    role: "seeker",
    userId,
    sessionId,
  });
  return session;
}

export async function pollMentorCall(userId: string, sessionId: string): Promise<CallPollSession> {
  const { session } = await invoke<{ session: CallPollSession }>("call_poll", {
    role: "mentor",
    userId,
    sessionId,
  });
  return session;
}

export async function pollIncomingCalls(mentorId: string): Promise<IncomingCall[]> {
  const { calls } = await invoke<{ calls: IncomingCall[] }>("call_poll", {
    role: "mentor",
    userId: mentorId,
  });
  return calls;
}

export async function respondToCall(
  mentorId: string,
  sessionId: string,
  action: "accept" | "decline"
): Promise<void> {
  await invoke("call_respond", { mentorId, sessionId, action });
}

export async function setSessionTopic(
  userId: string,
  sessionId: string,
  category: TopicCategory,
  topic: string
): Promise<void> {
  await invoke("set_session_topic", { userId, sessionId, category, topic });
}

export interface AgoraCredentials {
  appId: string;
  channel: string;
  token: string;
  uid: number;
}

export async function getAgoraCredentials(
  userId: string,
  sessionId: string
): Promise<AgoraCredentials> {
  return invoke<AgoraCredentials>("agora_token", { userId, sessionId });
}

export async function sessionTick(
  sessionId: string
): Promise<{ ended: boolean; coinsCharged: number; coinBalance: number }> {
  return invoke("session_tick", { sessionId });
}

export interface PaymentOrder {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export async function createPaymentOrder(userId: string, packId: string): Promise<PaymentOrder> {
  return invoke("create_order", { userId, packId });
}

export async function trackFunnelStep(visitorId: string, step: number): Promise<void> {
  await invoke("track_funnel", { visitorId, step });
}

export async function sendGift(
  userId: string,
  sessionId: string,
  giftId: string
): Promise<{ coinBalance: number }> {
  return invoke("send_gift", { userId, sessionId, giftId });
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
      description: string | null;
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
      description: t.description ?? undefined,
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
