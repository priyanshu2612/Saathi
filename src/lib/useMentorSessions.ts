"use client";

import { useEffect, useState } from "react";
import { getAccount, getMentorId } from "@/lib/data/backend";
import { isDemoMode } from "@/lib/supabase/client";
import { MOCK_INBOUND_SESSIONS } from "@/lib/mock-data";
import { seekerAvatarUrl } from "@/lib/format";
import { InboundSessionRecord } from "@/lib/types";

export interface MentorGiftEarning {
  id: string;
  description: string;
  coins: number;
  createdAt: string;
}

/** The signed-in Saathi's real conversations (with seeker names) and gift earnings. */
export function useMentorSessions() {
  const [sessions, setSessions] = useState<InboundSessionRecord[]>(isDemoMode ? MOCK_INBOUND_SESSIONS : []);
  const [gifts, setGifts] = useState<MentorGiftEarning[]>([]);
  const [loading, setLoading] = useState(!isDemoMode);

  useEffect(() => {
    if (isDemoMode) return;
    const mentorId = getMentorId();
    if (!mentorId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    getAccount(mentorId)
      .then((acct) => {
        if (cancelled) return;
        const earned = new Map<string, number>();
        for (const t of acct.transactions) {
          if (t.type === "session_earning" && t.relatedSessionId) {
            earned.set(t.relatedSessionId, (earned.get(t.relatedSessionId) ?? 0) + t.amount);
          }
        }
        setSessions(
          acct.sessions
            .filter((s) => s.status !== "ringing")
            .map((s) => {
              const name = s.seekerName ?? "A seeker";
              const end = s.endedAt ? new Date(s.endedAt).getTime() : Date.now();
              const mins = Math.max(0, Math.round((end - new Date(s.startedAt).getTime()) / 60000));
              return {
                id: s.id,
                seekerName: name,
                seekerPhotoUrl: seekerAvatarUrl(name),
                mode: s.mode,
                startedAt: s.startedAt,
                durationMin: mins,
                coinsEarned: earned.get(s.id) ?? 0,
              };
            })
            .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
        );
        setGifts(
          acct.transactions
            .filter((t) => t.type === "gift_received")
            .map((t) => ({
              id: t.id,
              description: t.description ?? "Gift received",
              coins: t.amount,
              createdAt: t.createdAt,
            }))
        );
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return { sessions, gifts, loading };
}
