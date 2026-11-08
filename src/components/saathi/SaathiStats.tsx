"use client";

import { useEffect, useState } from "react";
import {
  CaretLeft,
  CaretRight,
  Crown,
  HeartStraight,
  Lightbulb,
  PhoneDisconnect,
  PhoneIncoming,
  Target,
  Timer,
  Trophy,
  Wallet,
} from "@phosphor-icons/react";
import BottomSheet from "@/components/ui/BottomSheet";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { DAILY_ONLINE_TARGET_SECONDS, PAYOUT_DAYS } from "@/lib/business";
import { formatDuration, istDate, useLeaderboard, useMentorDayStats } from "@/lib/useMentorStats";

const card = "mx-5 mt-5 rounded-xl2 bg-linen-100 p-4";

/** "How to do the job" prompt at the top of the home page; opens a bottom sheet. */
export function HowToJobBanner() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="mx-5 mt-5 flex items-center justify-between gap-3 rounded-xl2 border border-warmth-500/30 bg-warmth-50 p-3.5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warmth-500/15 text-warmth-600">
            <Lightbulb size={20} weight="fill" />
          </span>
          <div>
            <p className="text-[14px] font-semibold text-dusk-900">How to do the job</p>
            <p className="text-[12px] text-dusk-500">Tips to earn more</p>
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="tap-target rounded-full bg-warmth-500 px-5 py-2 text-[13px] font-medium text-white"
        >
          View
        </button>
      </div>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="How to do the job">
        <ul className="mt-4 flex flex-col gap-3.5">
          {[
            {
              icon: HeartStraight,
              title: "Talk nicely",
              body: "Be warm, patient and respectful. People come to you to feel heard, so listen first.",
            },
            {
              icon: Timer,
              title: "Talk more, earn more",
              body: "Your earnings come from talk time. The longer a conversation runs, the more you earn.",
            },
            {
              icon: PhoneIncoming,
              title: "Pick up calls",
              body: "Accept calls quickly. Rejected and missed calls are lost earnings.",
            },
            {
              icon: Target,
              title: "Stay online",
              body: "Stay online at least 2 hours a day. More time online means more people reach you, and a higher spot on the leaderboard.",
            },
            {
              icon: Wallet,
              title: `Paid within ${PAYOUT_DAYS} days`,
              body: `Your payout is settled ${PAYOUT_DAYS} days after you earn it.`,
            },
          ].map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warmth-50 text-warmth-500">
                <Icon size={18} weight="fill" />
              </span>
              <div>
                <p className="text-[14px] font-semibold text-dusk-900">{title}</p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-dusk-500">{body}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-5">
          <PrimaryButton onClick={() => setOpen(false)}>Got it</PrimaryButton>
        </div>
      </BottomSheet>
    </>
  );
}

/** Today's goal: stay online 2 hours, with a progress bar of time met. */
export function DailyTargetCard({ online }: { online: boolean }) {
  const today = istDate();
  const { stats } = useMentorDayStats(today);
  const serverSeconds = stats?.onlineSeconds ?? 0;

  // Between 30s refreshes, keep the clock moving while the Saathi is online.
  const [extra, setExtra] = useState(0);
  useEffect(() => setExtra(0), [serverSeconds]);
  useEffect(() => {
    if (!online) return;
    const t = setInterval(() => setExtra((e) => Math.min(e + 1, 30)), 1000);
    return () => clearInterval(t);
  }, [online]);

  const seconds = serverSeconds + (online ? extra : 0);
  const pct = Math.min(100, Math.round((seconds / DAILY_ONLINE_TARGET_SECONDS) * 100));
  const met = seconds >= DAILY_ONLINE_TARGET_SECONDS;

  return (
    <div className={card}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-dusk-700">
          <Target size={18} weight="fill" className="text-warmth-500" />
          <span className="text-[14px] font-semibold">Today&apos;s target</span>
        </div>
        <span className="text-[12px] text-dusk-400">{pct}%</span>
      </div>
      <p className="mt-1 text-[13px] text-dusk-500">Stay online for at least 2 hours</p>
      <div
        className="mt-3 h-2.5 overflow-hidden rounded-full bg-linen-200"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div
          className={`h-full rounded-full transition-all ${met ? "bg-sage-400" : "bg-warmth-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-[12px] text-dusk-500">
        {met
          ? `Target met! ${formatDuration(seconds)} online today.`
          : `${formatDuration(seconds)} of 2h online${online ? "" : " · go online to keep counting"}`}
      </p>
    </div>
  );
}

function dayLabel(date: string) {
  if (date === istDate()) return "Today";
  if (date === istDate(-1)) return "Yesterday";
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** Calls received / rejected and talk time, with a date toggle. */
export function DayDashboardCard() {
  const [offset, setOffset] = useState(0);
  const date = istDate(offset);
  const { stats, loading } = useMentorDayStats(date);

  const tiles = [
    { label: "Calls received", value: stats ? String(stats.received) : "–", icon: PhoneIncoming },
    { label: "Calls rejected", value: stats ? String(stats.rejected) : "–", icon: PhoneDisconnect },
    { label: "Talk time", value: stats ? formatDuration(stats.talkSeconds) : "–", icon: Timer },
  ];

  return (
    <div className={card}>
      <div className="flex items-center justify-between">
        <p className="text-[14px] font-semibold text-dusk-700">Dashboard</p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setOffset((o) => o - 1)}
            aria-label="Previous day"
            className="tap-target flex h-8 w-8 items-center justify-center rounded-full bg-card text-dusk-700"
          >
            <CaretLeft size={14} weight="bold" />
          </button>
          <span className="min-w-[72px] text-center text-[13px] font-medium text-dusk-900">
            {dayLabel(date)}
          </span>
          <button
            onClick={() => setOffset((o) => Math.min(0, o + 1))}
            disabled={offset === 0}
            aria-label="Next day"
            className="tap-target flex h-8 w-8 items-center justify-center rounded-full bg-card text-dusk-700 disabled:opacity-30"
          >
            <CaretRight size={14} weight="bold" />
          </button>
        </div>
      </div>
      <div className={`mt-3 grid grid-cols-3 gap-2 transition-opacity ${loading ? "opacity-50" : ""}`}>
        {tiles.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl2 bg-card p-3 text-center">
            <Icon size={18} weight="fill" className="mx-auto text-warmth-500" />
            <p className="mt-1 text-[16px] font-semibold text-dusk-900">{value}</p>
            <p className="text-[11px] leading-tight text-dusk-400">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Saathis who've been online the most today. */
export function LeaderboardCard() {
  const { entries, me, loading } = useLeaderboard();
  const meInList = entries.some((e) => e.isMe);

  return (
    <div className={card}>
      <div className="flex items-center gap-2 text-dusk-700">
        <Trophy size={18} weight="fill" className="text-gold-500" />
        <span className="text-[14px] font-semibold">Most online today</span>
      </div>
      {entries.length === 0 ? (
        <p className="mt-2 text-[13px] text-dusk-400">
          {loading ? "Loading…" : "No one is on the board yet. Go online to take the first spot."}
        </p>
      ) : (
        <ol className="mt-3 flex flex-col gap-2">
          {entries.map((e) => (
            <LeaderRow key={e.mentorId} entry={e} />
          ))}
          {me && !meInList && (
            <>
              <li className="text-center text-[12px] text-dusk-400">···</li>
              <LeaderRow entry={me} />
            </>
          )}
        </ol>
      )}
    </div>
  );
}

function LeaderRow({ entry }: { entry: { rank: number; name: string; seconds: number; isMe: boolean } }) {
  return (
    <li
      className={`flex items-center gap-3 rounded-xl2 px-3 py-2.5 ${
        entry.isMe ? "bg-warmth-50 ring-1 ring-warmth-500/30" : "bg-card"
      }`}
    >
      <span className="flex w-6 justify-center text-[13px] font-semibold text-dusk-500">
        {entry.rank === 1 ? <Crown size={18} weight="fill" className="text-gold-500" /> : entry.rank}
      </span>
      <span className="flex-1 truncate text-[14px] text-dusk-900">
        {entry.isMe && entry.name !== "You" ? `${entry.name} (you)` : entry.name}
      </span>
      <span className="text-[13px] font-semibold text-dusk-700">{formatDuration(entry.seconds)}</span>
    </li>
  );
}
