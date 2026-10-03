"use client";

import { useEffect, useRef, useState } from "react";
import { useAppState } from "./store";
import { Mentor, SessionRecord } from "./types";

/**
 * Runs the per-minute coin billing tick for a live session (chat, audio, or
 * video — the rate is whatever `session.ratePerMinute` was locked in at
 * start). Shared by the chat screen and the audio/video call screen so the
 * charge-in-6s-ticks logic only lives in one place.
 */
export function useSessionBilling(session: SessionRecord | undefined, mentor: Mentor | undefined) {
  const { coinBalance, spendCoins, endSession } = useAppState();

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [charged, setCharged] = useState(0);
  const [ended, setEnded] = useState(false);
  const [showLowBalance, setShowLowBalance] = useState(false);

  const lastChargedMinuteRef = useRef(0);
  const elapsedSecondsRef = useRef(0);
  const chargedRef = useRef(0);

  useEffect(() => {
    if (!session || !mentor || ended) return;
    const interval = setInterval(() => {
      elapsedSecondsRef.current += 1;
      setElapsedSeconds(elapsedSecondsRef.current);

      const minutesElapsed = elapsedSecondsRef.current / 60;
      const wholeMinutesDue = Math.ceil(minutesElapsed * 10) / 10; // charge in 6s ticks
      const dueCoins = Math.ceil(
        wholeMinutesDue * session.ratePerMinute - lastChargedMinuteRef.current * session.ratePerMinute
      );
      if (dueCoins <= 0) return;

      lastChargedMinuteRef.current = wholeMinutesDue;
      spendCoins(dueCoins, session.id).then((ok) => {
        if (!ok) {
          clearInterval(interval);
          setEnded(true);
          endSession(session.id, chargedRef.current);
          return;
        }
        chargedRef.current += dueCoins;
        setCharged(chargedRef.current);
      });
    }, 6000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, mentor?.id, ended]);

  useEffect(() => {
    if (!session) return;
    // Nudge ~3 minutes before the balance runs out.
    setShowLowBalance(coinBalance < session.ratePerMinute * 3 && coinBalance > 0 && !ended);
  }, [coinBalance, session, ended]);

  const endNow = () => {
    if (!session || ended) return;
    setEnded(true);
    endSession(session.id, chargedRef.current);
  };

  return { elapsedSeconds, charged, ended, showLowBalance, endNow };
}
