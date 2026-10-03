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

export type TopicCategory = "social" | "dating" | "life";

// Conversation topics a seeker picks from on the video-call waiting screen.
// Keep the labels in sync with the allowed categories in
// supabase/functions/set_session_topic.
export const CALL_TOPICS: { id: TopicCategory; label: string; topics: string[] }[] = [
  {
    id: "social",
    label: "Social",
    topics: [
      "Talk to Someone New",
      "Make New Friends",
      "College & Campus",
      "Work & Networking",
      "Group Conversations",
    ],
  },
  {
    id: "dating",
    label: "Dating",
    topics: [
      "Approach a Girl",
      "First Date",
      "Ask Someone Out",
      "Keep the Conversation Going",
      "Handle Rejection",
    ],
  },
  {
    id: "life",
    label: "Life",
    topics: [
      "Difficult Conversations",
      "Set Boundaries",
      "Talk About Feelings",
      "Breakups & Closure",
      "Stress & Work Pressure",
    ],
  },
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
  type:
    | "purchase"
    | "bonus"
    | "session_spend"
    | "session_earning"
    | "refund"
    | "free_credit"
    | "gift_sent"
    | "gift_received";
  createdAt: string;
  relatedSessionId?: string;
  /** Short note shown in history, e.g. "Teddy Bear to Priya". */
  description?: string;
}

export interface SessionRecord {
  id: string;
  mentorId: string;
  mode: SessionMode;
  startedAt: string;
  endedAt?: string;
  status: "ringing" | "active" | "completed";
  totalCoinsCharged: number;
  ratePerMinute: number;
  topicCategory?: TopicCategory;
  topic?: string;
}

// A gift a seeker sent this Saathi — powers the Saathi-side acknowledgement
// and the gifts shown in their earnings history.
export interface ReceivedGift {
  id: string;
  giftId: string;
  giftName: string;
  coins: number; // what the Saathi earned (after the platform share)
  from: string;
  createdAt: string;
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
