"use client";

import { useEffect, useState } from "react";
import {
  getMentorDayStats,
  getMentorId,
  getMentorLeaderboard,
  LeaderboardEntry,
  MentorDayStats,
} from "@/lib/data/backend";
import { isDemoMode } from "@/lib/supabase/client";

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** India (IST) calendar day as "YYYY-MM-DD", `offsetDays` from today. */
export function istDate(offsetDays = 0): string {
  return new Date(Date.now() + IST_OFFSET_MS + offsetDays * 86_400_000).toISOString().slice(0, 10);
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

const DEMO_STATS: MentorDayStats = {
  date: "",
  received: 12,
  rejected: 3,
  talkSeconds: 47 * 60,
  onlineSeconds: 95 * 60,
};

const DEMO_BOARD: LeaderboardEntry[] = [
  { rank: 1, mentorId: "d1", name: "Ananya", seconds: 5 * 3600 + 20 * 60, isMe: false },
  { rank: 2, mentorId: "d2", name: "Riya", seconds: 4 * 3600 + 5 * 60, isMe: false },
  { rank: 3, mentorId: "d3", name: "You", seconds: 95 * 60, isMe: true },
];

/** Stats for one day. Refreshes every 30s so today's numbers stay live. */
export function useMentorDayStats(date: string) {
  const [stats, setStats] = useState<MentorDayStats | null>(isDemoMode ? { ...DEMO_STATS, date } : null);
  const [loading, setLoading] = useState(!isDemoMode);

  useEffect(() => {
    if (isDemoMode) {
      setStats({ ...DEMO_STATS, date });
      return;
    }
    const mentorId = getMentorId();
    if (!mentorId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const load = () =>
      getMentorDayStats(mentorId, date)
        .then((s) => !cancelled && setStats(s))
        .catch(() => {})
        .finally(() => !cancelled && setLoading(false));
    load();
    const timer = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [date]);

  return { stats, loading };
}

/** Today's most-online Saathis. */
export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(isDemoMode ? DEMO_BOARD : []);
  const [me, setMe] = useState<LeaderboardEntry | null>(isDemoMode ? DEMO_BOARD[2] : null);
  const [loading, setLoading] = useState(!isDemoMode);

  useEffect(() => {
    if (isDemoMode) return;
    const mentorId = getMentorId();
    if (!mentorId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = () =>
      getMentorLeaderboard(mentorId)
        .then((res) => {
          if (cancelled) return;
          setEntries(res.entries);
          setMe(res.me);
        })
        .catch(() => {})
        .finally(() => !cancelled && setLoading(false));
    load();
    const timer = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return { entries, me, loading };
}
