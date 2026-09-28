export type MoodTag =
  | "stress"
  | "loneliness"
  | "breakup"
  | "work"
  | "just_talk"
  | "fun"
  | "flirt"
  | "friend";

export const MOOD_TAGS: { id: MoodTag; label: string }[] = [
  { id: "stress", label: "Stress" },
  { id: "loneliness", label: "Loneliness" },
  { id: "breakup", label: "Breakup" },
  { id: "work", label: "Work pressure" },
  { id: "just_talk", label: "Just want to talk" },
  { id: "fun", label: "Fun" },
  { id: "flirt", label: "Flirt" },
  { id: "friend", label: "Friend" },
];

export const COMMUNICATION_TAG_OPTIONS = [
  "Calm",
  "Supportive",
  "Non-judgmental",
  "Active Listener",
  "Warm",
  "Friendly",
  "Easy to Talk To",
  "Cooperative",
  "Gentle",
];

export const PERSONALITY_TAG_OPTIONS = [
  "Empathetic",
  "Patient",
  "Grounded",
  "Caring",
  "Friendly",
  "Open-minded",
];

export type MentorTier = "standard" | "top_rated";

export type SessionMode = "chat" | "audio" | "video";

export interface Mentor {
  id: string;
  name: string;
  photoUrl: string; // cover photo — first photos[] entry, kept for back-compat
  photos: string[]; // gallery media — first entry is the default hero
  videos: string[]; // 2-3 short intro clips, mixed into the gallery filmstrip
  tagline: string; // short one-liner shown under the name on cards
  tags: MoodTag[];
  languages: string[];
  bio: string;
  rateChat: number; // coins per minute
  rateAudio: number;
  rateVideo: number;
  rating: number; // 0-5
  sessionCount: number;
  isOnline: boolean;
  tier: MentorTier;
  popular?: boolean;
  rising?: boolean;
  responseRatePct: number;
  boundaries?: string[];
  // Personal details block (mentor profile page)
  age: number;
  gender: string;
  nationality: string;
  bornCity: string;
  qualification: string;
  college?: string;
  school?: string;
  religion?: string;
  communicationTags: string[];
  personalityTags: string[];
}

export interface CoinTransaction {
  id: string;
  amount: number; // positive = credit, negative = debit
  type: "purchase" | "session_spend" | "session_earning" | "refund" | "free_credit";
  createdAt: string;
  relatedSessionId?: string;
}

export interface SessionRecord {
  id: string;
  mentorId: string;
  mode: SessionMode;
  startedAt: string;
  endedAt?: string;
  status: "active" | "completed";
  totalCoinsCharged: number;
  ratePerMinute: number;
}

export interface CoinPack {
  id: string;
  name: string;
  priceInr: number;
  coins: number;
  bonusLabel: string;
  frame: string;
}

// A seeker who contacted this mentor — shown on the mentor's own
// "Seekers" history tab. Distinct from SessionRecord, which tracks the
// current user's outbound calls when acting as a seeker.
export interface InboundSessionRecord {
  id: string;
  seekerName: string;
  seekerPhotoUrl: string;
  mode: SessionMode;
  startedAt: string;
  durationMin: number;
  coinsEarned: number;
}

export interface ChatMessage {
  id: string;
  sender: "seeker" | "mentor";
  text: string;
  createdAt: string;
}
