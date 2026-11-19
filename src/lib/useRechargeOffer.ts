"use client";

import { useCallback, useEffect, useState } from "react";
import { getRechargeOffer, getSeekerId } from "@/lib/data/backend";
import { isDemoMode } from "@/lib/supabase/client";
import { useAppState } from "@/lib/store";

export const OFFER_BONUS_COINS = 50;
const OFFER_SECONDS = 5 * 60;
const DEMO_KEY = "sukoon-recharge-offer-start";

/**
 * The one-time "recharge within 5 minutes for 50 extra coins" offer. In real
 * mode the clock lives on the server (started the first time it's read); in
 * demo mode it's kept locally.
 */
export function useRechargeOffer() {
  const { isAuthenticated, hydrated } = useAppState();
  const [endAt, setEndAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const refresh = useCallback(() => {
    if (!hydrated || !isAuthenticated) return;
    if (isDemoMode) {
      let started = Number(window.localStorage.getItem(DEMO_KEY));
      if (!started) {
        started = Date.now();
        window.localStorage.setItem(DEMO_KEY, String(started));
      }
      setEndAt(started + OFFER_SECONDS * 1000);
      return;
    }
    const seekerId = getSeekerId();
    if (!seekerId) return;
    getRechargeOffer(seekerId)
      .then((o) => setEndAt(o.active ? Date.now() + o.secondsLeft * 1000 : null))
      .catch(() => {});
  }, [hydrated, isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!endAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [endAt]);

  const secondsLeft = endAt ? Math.max(0, Math.round((endAt - now) / 1000)) : 0;
  return { active: secondsLeft > 0, secondsLeft, bonusCoins: OFFER_BONUS_COINS, refresh };
}

export function formatCountdown(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
