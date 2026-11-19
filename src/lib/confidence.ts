import { SessionRecord } from "./types";

export interface ConfidenceLevel {
  level: number;
  name: string;
  minutes: number; // total minutes talked needed to reach this level
}

export const CONFIDENCE_LEVELS: ConfidenceLevel[] = [
  { level: 1, name: "Shy Starter", minutes: 0 },
  { level: 2, name: "Warming Up", minutes: 10 },
  { level: 3, name: "Getting Comfortable", minutes: 30 },
  { level: 4, name: "Confident Talker", minutes: 60 },
  { level: 5, name: "Social Star", minutes: 120 },
  { level: 6, name: "Conversation Champ", minutes: 240 },
];

const MAX_MINUTES = CONFIDENCE_LEVELS[CONFIDENCE_LEVELS.length - 1].minutes;
const MAX_SESSION_SECONDS = 3 * 60 * 60;

/** Whole minutes the seeker has spent talking, across chat, audio and video. */
export function minutesTalked(sessions: SessionRecord[], now = Date.now()): number {
  let seconds = 0;
  for (const s of sessions) {
    if (s.status === "ringing") continue;
    const end = s.endedAt ? new Date(s.endedAt).getTime() : now;
    const secs = (end - new Date(s.startedAt).getTime()) / 1000;
    if (secs > 0) seconds += Math.min(secs, MAX_SESSION_SECONDS);
  }
  return Math.floor(seconds / 60);
}

export interface ConfidenceProgress {
  minutes: number;
  percent: number; // overall confidence meter, 0–100
  current: ConfidenceLevel;
  next: ConfidenceLevel | null;
  levelPercent: number; // progress from current level to the next, 0–100
  minutesToNext: number;
}

export function confidenceProgress(minutes: number): ConfidenceProgress {
  let current = CONFIDENCE_LEVELS[0];
  for (const l of CONFIDENCE_LEVELS) if (minutes >= l.minutes) current = l;
  const next = CONFIDENCE_LEVELS.find((l) => l.minutes > current.minutes) ?? null;
  const span = next ? next.minutes - current.minutes : 1;
  return {
    minutes,
    percent: Math.min(100, Math.round((minutes / MAX_MINUTES) * 100)),
    current,
    next,
    levelPercent: next ? Math.min(100, Math.round(((minutes - current.minutes) / span) * 100)) : 100,
    minutesToNext: next ? Math.max(0, next.minutes - minutes) : 0,
  };
}

export interface ScenarioBadge {
  id: string;
  title: string;
  hint: string;
  unlocked: (sessions: SessionRecord[]) => boolean;
}

const hasCategory = (sessions: SessionRecord[], c: string) => sessions.some((s) => s.topicCategory === c);

/** Badges you earn by talking in different kinds of situations. */
export const SCENARIO_BADGES: ScenarioBadge[] = [
  { id: "casual", title: "Casual hangout", hint: "Chat about everyday, social things", unlocked: (s) => hasCategory(s, "social") },
  { id: "dating", title: "First-date ready", hint: "Practice dating & relationship talk", unlocked: (s) => hasCategory(s, "dating") },
  { id: "heart", title: "Heart-to-heart", hint: "Open up about life & emotions", unlocked: (s) => hasCategory(s, "life") },
  {
    id: "voice",
    title: "Face to face",
    hint: "Try an audio or video call",
    unlocked: (s) => s.some((x) => x.mode !== "chat" && x.status !== "ringing"),
  },
];
