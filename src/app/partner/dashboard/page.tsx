"use client";

import { useRouter } from "next/navigation";
import { Coins, Gear, ChatCircleDots, Timer } from "@phosphor-icons/react";
import { useAppState } from "@/lib/store";
import MentorBottomNav from "@/components/ui/MentorBottomNav";

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

  const handleAccept = () => {
    simulateEarning(mentorProfile.rateChat * 6);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex items-center justify-between px-5 pt-6">
        <div>
          <p className="text-[13px] text-dusk-400">Welcome back</p>
          <h1 className="font-display text-[22px] text-dusk-900">{mentorProfile.name}</h1>
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

      {mentorOnline && (
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
        <p className="text-[13px] font-medium text-dusk-700">Your rate</p>
        <p className="mt-1 text-[14px] text-dusk-900">
          You earn <span className="font-semibold">{Math.round(mentorProfile.rateChat * 0.65)} coins</span> for
          every minute of chat — that&apos;s a 65% share, always visible, never a hidden cut.
        </p>
      </div>

      <div className="mt-auto" />
      <MentorBottomNav />
    </div>
  );
}
