"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Coins, Gear, ChatCircleDots, Phone, VideoCamera, Timer } from "@phosphor-icons/react";
import { useAppState } from "@/lib/store";
import { isDemoMode } from "@/lib/supabase/client";
import { getMentorId, IncomingCall, pollIncomingCalls, respondToCall } from "@/lib/data/backend";
import MentorBottomNav from "@/components/ui/MentorBottomNav";
import { coinsToInr, formatInr, seekerAvatarUrl } from "@/lib/format";

const SAATHI_SHARE = 0.65;
// Rough share of online time actually spent in a conversation.
const TALK_TIME_RATIO = 0.5;
const ACTIVE_HOUR_OPTIONS = [1, 2, 4];

const DEMO_REQUEST = {
  seekerNote: "wants to talk about work stress",
  waitSeconds: 22,
};

export default function MentorDashboardPage() {
  const router = useRouter();
  const {
    mentorOnline,
    setMentorOnline,
    mentorEarnings,
    mentorSessionsHelped,
    mentorProfile,
    simulateEarning,
  } = useAppState();

  const [calls, setCalls] = useState<IncomingCall[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [callError, setCallError] = useState<string | null>(null);

  // Real mode: poll for seekers ringing this Saathi while they're online.
  useEffect(() => {
    if (isDemoMode || !mentorOnline) {
      setCalls([]);
      return;
    }
    const mentorId = getMentorId();
    if (!mentorId) return;
    let cancelled = false;
    const tick = () =>
      pollIncomingCalls(mentorId)
        .then((list) => {
          if (!cancelled) setCalls(list);
        })
        .catch(() => {});
    tick();
    const poll = setInterval(tick, 2000);
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      cancelled = true;
      clearInterval(poll);
      clearInterval(clock);
    };
  }, [mentorOnline]);

  const respond = async (call: IncomingCall, action: "accept" | "decline") => {
    const mentorId = getMentorId();
    if (!mentorId) return;
    setCallError(null);
    try {
      await respondToCall(mentorId, call.id, action);
      setCalls((prev) => prev.filter((c) => c.id !== call.id));
      if (action === "accept") router.push(`/partner/call/${call.id}`);
    } catch (err) {
      setCalls((prev) => prev.filter((c) => c.id !== call.id));
      setCallError(err instanceof Error ? err.message : "Couldn't answer this call.");
    }
  };

  const handleAccept = () => {
    simulateEarning(mentorProfile.rateChat * 6);
  };

  const incoming = calls[0];

  const earnPerMin = (rate: number) => Math.round(rate * SAATHI_SHARE);
  const RATE_ROWS = [
    { label: "Chat", icon: ChatCircleDots, earn: earnPerMin(mentorProfile.rateChat) },
    { label: "Audio", icon: Phone, earn: earnPerMin(mentorProfile.rateAudio) },
    { label: "Video", icon: VideoCamera, earn: earnPerMin(mentorProfile.rateVideo) },
  ];
  const avgEarnPerMin = RATE_ROWS.reduce((sum, r) => sum + r.earn, 0) / RATE_ROWS.length;

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex items-center justify-between px-5 pt-6">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mentorProfile.photos[0] ?? mentorProfile.photoUrl}
            alt={mentorProfile.name}
            className="h-14 w-14 rounded-full object-cover ring-2 ring-linen-200"
          />
          <div>
            <p className="text-[13px] text-dusk-400">Welcome back</p>
            <h1 className="font-display text-[22px] text-dusk-900">{mentorProfile.name}</h1>
          </div>
        </div>
        <button
          onClick={() => router.push("/partner/profile")}
          className="tap-target flex h-9 w-9 items-center justify-center rounded-full bg-linen-100 text-dusk-700"
          aria-label="Edit profile"
        >
          <Gear size={18} />
        </button>
      </div>

      <button
        onClick={() => setMentorOnline(!mentorOnline)}
        className={`tap-target mx-5 mt-6 flex items-center justify-between rounded-xl3 border p-5 transition ${
          mentorOnline
            ? "border-sage-400 bg-sage-400/10"
            : "border-linen-200 bg-linen-100"
        }`}
      >
        <div className="text-left">
          <p className="font-display text-[18px] text-dusk-900">
            {mentorOnline ? "You're online" : "You're offline"}
          </p>
          <p className="mt-0.5 text-[13px] text-dusk-400">
            {mentorOnline ? "Seekers can find and talk to you now" : "Tap to start receiving conversations"}
          </p>
        </div>
        <span
          className={`relative flex h-8 w-14 items-center rounded-full transition ${
            mentorOnline ? "bg-sage-400 animate-pulseGlow" : "bg-linen-200"
          }`}
        >
          <span
            className={`absolute h-6 w-6 rounded-full bg-white shadow-warm-sm transition ${
              mentorOnline ? "translate-x-7" : "translate-x-1"
            }`}
          />
        </span>
      </button>

      <div className="mx-5 mt-5 rounded-xl2 bg-linen-100 p-4">
        <div className="flex items-center gap-2 text-dusk-700">
          <Coins size={18} weight="fill" className="text-gold-500" />
          <span className="text-[14px] font-semibold">{mentorEarnings} coins earned today</span>
        </div>
        <p className="mt-1 text-[13px] text-dusk-400">
          {mentorSessionsHelped > 0
            ? `${mentorSessionsHelped} people felt a little lighter today because of you.`
            : "Go online to start your first conversation."}
        </p>
      </div>

      {callError && <p className="mx-5 mt-4 text-[13px] text-warmth-600">{callError}</p>}

      {!isDemoMode && incoming && (
        <div className="mx-5 mt-5 rounded-xl2 border border-warmth-500/30 bg-warmth-50 p-4">
          <div className="flex items-center gap-2 text-warmth-700">
            <VideoCamera size={18} weight="fill" />
            <span className="text-[14px] font-semibold">Incoming video call</span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={seekerAvatarUrl(incoming.seekerName)}
              alt={incoming.seekerName}
              className="h-12 w-12 rounded-full object-cover"
            />
            <p className="text-[15px] font-medium text-dusk-900">{incoming.seekerName}</p>
          </div>
          <p className="mt-0.5 text-[13px] text-dusk-700">
            {incoming.topic ? `Topic: ${incoming.topic}` : "Choosing a topic…"}
          </p>
          <div className="mt-1 flex items-center gap-1 text-[12px] text-dusk-400">
            <Timer size={13} /> Ringing {Math.max(0, Math.floor((now - new Date(incoming.startedAt).getTime()) / 1000))}s
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => respond(incoming, "accept")}
              className="tap-target flex-1 rounded-full bg-warmth-500 py-2.5 text-[13px] font-medium text-white"
            >
              Accept
            </button>
            <button
              onClick={() => respond(incoming, "decline")}
              className="tap-target flex-1 rounded-full bg-linen-100 py-2.5 text-[13px] font-medium text-dusk-700"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {isDemoMode && mentorOnline && (
        <div className="mx-5 mt-5 rounded-xl2 border border-warmth-500/30 bg-warmth-50 p-4">
          <div className="flex items-center gap-2 text-warmth-700">
            <ChatCircleDots size={18} />
            <span className="text-[14px] font-semibold">Incoming request</span>
          </div>
          <p className="mt-1 text-[13px] text-dusk-700">
            Someone {DEMO_REQUEST.seekerNote}.
          </p>
          <div className="mt-1 flex items-center gap-1 text-[12px] text-dusk-400">
            <Timer size={13} /> Waiting {DEMO_REQUEST.waitSeconds}s
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleAccept}
              className="tap-target flex-1 rounded-full bg-warmth-500 py-2.5 text-[13px] font-medium text-white"
            >
              Accept
            </button>
            <button className="tap-target flex-1 rounded-full bg-linen-100 py-2.5 text-[13px] font-medium text-dusk-700">
              Decline
            </button>
          </div>
        </div>
      )}

      <div className="mx-5 mt-5 rounded-xl2 bg-linen-100 p-4">
        <p className="text-[13px] font-medium text-dusk-700">Your rates</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {RATE_ROWS.map(({ label, icon: Icon, earn }) => (
            <div key={label} className="rounded-xl2 bg-card p-3 text-center">
              <Icon size={18} weight="fill" className="mx-auto text-warmth-500" />
              <p className="mt-1 text-[12px] text-dusk-400">{label}</p>
              <p className="text-[15px] font-semibold text-dusk-900">{earn} coins</p>
              <p className="text-[11px] text-dusk-400">/min · ≈ {formatInr(coinsToInr(earn))}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[12px] text-dusk-400">
          A {Math.round(SAATHI_SHARE * 100)}% share, always visible, never a hidden cut.
        </p>
      </div>

      <div className="mx-5 mt-5 rounded-xl2 bg-linen-100 p-4">
        <p className="text-[13px] font-medium text-dusk-700">Today&apos;s earning potential</p>
        <p className="mt-0.5 text-[12px] text-dusk-400">
          Stay online and active to earn — an estimate assuming you&apos;re in conversation about half the time.
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {ACTIVE_HOUR_OPTIONS.map((hours) => {
            const coins = Math.round(hours * 60 * TALK_TIME_RATIO * avgEarnPerMin);
            return (
              <div key={hours} className="flex items-center justify-between rounded-xl2 bg-card px-4 py-2.5">
                <span className="text-[14px] text-dusk-700">
                  Active for <span className="font-semibold text-dusk-900">{hours} hr{hours > 1 ? "s" : ""}</span>
                </span>
                <span className="text-[14px] font-semibold text-sage-500">≈ {formatInr(coinsToInr(coins))}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-auto" />
      <MentorBottomNav />
    </div>
  );
}
