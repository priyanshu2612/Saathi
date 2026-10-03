"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CheckCircle, PhoneDisconnect } from "@phosphor-icons/react";
import Chip from "@/components/ui/Chip";
import { useAppState } from "@/lib/store";
import { isDemoMode } from "@/lib/supabase/client";
import { getSeekerId, pollSeekerCall } from "@/lib/data/backend";
import { CALL_TOPICS, Mentor, SessionRecord, TopicCategory } from "@/lib/types";

const LOCK_SECONDS = 3;
const POLL_MS = 1500;
const DEMO_PICKUP_MS = 8000;

export type CallEndReason = "declined" | "missed" | "cancelled" | "ended";

const randomTopic = (category: TopicCategory) => {
  const topics = CALL_TOPICS.find((c) => c.id === category)!.topics;
  return topics[Math.floor(Math.random() * topics.length)];
};

// A topic label is unique across tabs, so the category it's sent with is
// always derived from it — not from whichever tab happens to be showing.
const categoryOf = (topic: string) => CALL_TOPICS.find((c) => c.topics.includes(topic))!.id;

/**
 * The "ringing" screen for a video call: the Saathi's avatar over a blurred
 * copy of itself, with the topic picker in a modal card. One topic is always
 * selected (a random Dating one by default); pressing Submit starts a 3s
 * countdown, after which the choice is locked and sent with the call.
 */
export default function CallWaiting({
  session,
  mentor,
  onAnswered,
  onEnded,
  onCancel,
}: {
  session: SessionRecord;
  mentor: Mentor;
  onAnswered: () => void;
  onEnded: (reason: CallEndReason) => void;
  onCancel: () => void;
}) {
  const { setSessionTopic } = useAppState();

  const [category, setCategory] = useState<TopicCategory>("dating");
  const [topic, setTopic] = useState(() => randomTopic("dating"));
  const [chosenByUser, setChosenByUser] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [ringSeconds, setRingSeconds] = useState(0);

  // Latest selection for the async paths (call answered, countdown done) so
  // they never lock a stale one.
  const topicRef = useRef(topic);
  topicRef.current = topic;
  const lockedRef = useRef(false);

  const lockTopic = useCallback(async () => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    setLocked(true);
    setCountdown(null);
    try {
      await setSessionTopic(session.id, categoryOf(topicRef.current), topicRef.current);
    } catch {
      /* the call still goes ahead; the Saathi just won't see a topic */
    }
  }, [session.id, setSessionTopic]);

  // Countdown after pressing Submit.
  useEffect(() => {
    if (countdown === null || locked) return;
    if (countdown <= 0) {
      lockTopic();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => (c === null ? c : c - 1)), 1000);
    return () => clearTimeout(t);
  }, [countdown, locked, lockTopic]);

  // Elapsed ringing time.
  useEffect(() => {
    const t = setInterval(() => setRingSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Watch for the Saathi picking up (or declining / not answering).
  useEffect(() => {
    let cancelled = false;
    let finished = false;

    const finish = async (action: () => void) => {
      if (finished) return;
      finished = true;
      // If the Saathi picks up first, send whichever topic is selected now.
      if (action === answeredAction) await lockTopic();
      if (!cancelled) action();
    };
    const answeredAction = () => onAnswered();

    if (isDemoMode) {
      const t = setTimeout(() => finish(answeredAction), DEMO_PICKUP_MS);
      return () => {
        cancelled = true;
        clearTimeout(t);
      };
    }

    const seekerId = getSeekerId();
    const interval = setInterval(async () => {
      if (!seekerId || finished) return;
      try {
        const { status } = await pollSeekerCall(seekerId, session.id);
        if (status === "active") finish(answeredAction);
        else if (status === "declined" || status === "missed" || status === "cancelled")
          finish(() => onEnded(status));
        else if (status === "completed") finish(() => onEnded("ended"));
      } catch {
        /* transient network error — keep polling */
      }
    }, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id]);

  const selectTopic = (next: string) => {
    if (locked || countdown !== null) return;
    setTopic(next);
    setChosenByUser(true);
  };

  const selectCategory = (next: TopicCategory) => {
    if (locked || countdown !== null || next === category) return;
    setCategory(next);
    // A user's explicit pick stays selected across tabs (only one option is
    // ever selected); otherwise the new tab gets its own random default.
    if (!chosenByUser) setTopic(randomTopic(next));
  };

  const activeCategory = CALL_TOPICS.find((c) => c.id === category)!;
  const progress = countdown === null ? 0 : ((LOCK_SECONDS - countdown + 1) / LOCK_SECONDS) * 100;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-dusk-900">
      {/* Blurred avatar backdrop with a 20% black wash */}
      <Image
        src={mentor.photoUrl}
        alt=""
        fill
        priority
        sizes="430px"
        className="scale-125 object-cover blur-2xl"
      />
      <div className="absolute inset-0 bg-black/20" />

      <div className="relative flex items-center justify-end px-5 pt-6">
        <button
          onClick={onCancel}
          className="tap-target flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-2 text-[13px] font-medium text-white backdrop-blur"
        >
          <PhoneDisconnect size={16} weight="fill" />
          Cancel
        </button>
      </div>

      <div className="relative flex flex-col items-center px-6 pt-4">
        <div className="relative flex h-40 w-40 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-white/15" />
          <span className="absolute inset-3 rounded-full bg-white/10" />
          <div className="relative h-28 w-28 overflow-hidden rounded-full ring-4 ring-white/40">
            <Image src={mentor.photoUrl} alt={mentor.name} fill className="object-cover" sizes="112px" />
          </div>
        </div>
        <h1 className="mt-4 font-display text-[22px] text-white">{mentor.name}</h1>
        <p className="mt-1 text-[14px] text-white/80">
          Ringing… {ringSeconds > 0 && `${ringSeconds}s`}
        </p>
      </div>

      <div className="relative mx-5 mb-[max(24px,env(safe-area-inset-bottom))] mt-auto rounded-[24px] border border-linen-200 bg-card p-5 shadow-float">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-dusk-400">
          Choose your topic
        </p>

        <div role="tablist" className="mt-3 flex gap-1 rounded-xl2 bg-linen-100 p-1">
          {CALL_TOPICS.map((c) => (
            <button
              key={c.id}
              role="tab"
              aria-selected={c.id === category}
              onClick={() => selectCategory(c.id)}
              disabled={locked || countdown !== null}
              className={`tap-target flex-1 rounded-[10px] py-2 text-[12px] font-semibold uppercase tracking-wide transition ${
                c.id === category ? "bg-warmth-500 text-white" : "text-dusk-700"
              } disabled:cursor-default`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div role="radiogroup" aria-label="Topic" className="mt-4 flex flex-wrap gap-2">
          {activeCategory.topics.map((t) => (
            <Chip
              key={t}
              label={t}
              selected={t === topic}
              onClick={() => selectTopic(t)}
            />
          ))}
        </div>

        {locked ? (
          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[13px] font-medium text-sage-500">
            <CheckCircle size={16} weight="fill" />
            Topic locked: {topic}
          </p>
        ) : (
          <>
            <button
              onClick={() => setCountdown(LOCK_SECONDS)}
              disabled={countdown !== null}
              className="tap-target relative mt-4 w-full overflow-hidden rounded-[12px] bg-warmth-500 px-5 py-3.5 text-[15px] font-medium text-white shadow-warm-sm transition active:scale-[0.98] disabled:active:scale-100"
            >
              {countdown !== null && (
                <span
                  className="absolute inset-y-0 left-0 bg-warmth-700/40 transition-[width] duration-1000 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              )}
              <span className="relative">
                {countdown === null ? "Submit" : `Locking in ${countdown}s…`}
              </span>
            </button>
            {countdown !== null && (
              <button
                onClick={() => setCountdown(null)}
                className="tap-target mt-2 w-full text-center text-[13px] font-medium text-dusk-700 underline"
              >
                Change topic
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
