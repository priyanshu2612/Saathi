"use client";

import { useMemo, useState } from "react";
import {
  CaretRight,
  ChatsCircle,
  Crown,
  Fire,
  GraduationCap,
  HeartStraight,
  Lock,
  Plant,
  Leaf,
  Smiley,
  Star,
  Sun,
  Trophy,
} from "@phosphor-icons/react";
import BottomSheet from "@/components/ui/BottomSheet";
import PrimaryButton from "@/components/ui/PrimaryButton";
import {
  CONFIDENCE_LEVELS,
  SCENARIO_BADGES,
  confidenceProgress,
  minutesTalked,
} from "@/lib/confidence";
import { useAppState } from "@/lib/store";

const LEVEL_ICONS = [Leaf, Plant, Sun, Fire, Star, Crown];

const TOPIC_TIPS = [
  { icon: Smiley, title: "Casual & social", tip: "Start small: your day, music, shows, weekend plans." },
  { icon: GraduationCap, title: "College & career", tip: "Practise introductions, interviews and speaking up." },
  { icon: HeartStraight, title: "Dating & relationships", tip: "Rehearse first-date talk and saying how you feel." },
  { icon: ChatsCircle, title: "Life & emotions", tip: "Share what's on your mind. It builds confidence fastest." },
];

/** Home-page snippet (minutes talked + confidence meter) that opens the gamified guide. */
export default function ConfidenceCard({ onTalk }: { onTalk?: () => void }) {
  const { sessions } = useAppState();
  const [open, setOpen] = useState(false);

  const progress = useMemo(() => confidenceProgress(minutesTalked(sessions)), [sessions]);
  const Icon = LEVEL_ICONS[progress.current.level - 1];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="tap-target mx-5 mt-4 flex w-[calc(100%-2.5rem)] items-center gap-3 rounded-xl2 border border-linen-200 bg-linen-100 p-3.5 text-left"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-warmth-500 text-white">
          <Icon size={22} weight="fill" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className="text-[14px] font-semibold text-dusk-900">Confidence meter</span>
            <span className="text-[13px] font-bold text-warmth-600">{progress.percent}%</span>
          </span>
          <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-linen-200">
            <span
              className="block h-full rounded-full bg-gradient-to-r from-warmth-400 to-warmth-600 transition-all duration-700"
              style={{ width: `${Math.max(progress.percent, progress.percent > 0 ? 4 : 0)}%` }}
            />
          </span>
          <span className="mt-1 block text-[12px] text-dusk-500">
            {progress.minutes} min talked · Level {progress.current.level}, {progress.current.name}
          </span>
        </span>
        <CaretRight size={16} className="shrink-0 text-dusk-400" />
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Your confidence journey">
        <Guide progress={progress} sessions={sessions} onTalk={() => { setOpen(false); onTalk?.(); }} />
      </BottomSheet>
    </>
  );
}

function Guide({
  progress,
  sessions,
  onTalk,
}: {
  progress: ReturnType<typeof confidenceProgress>;
  sessions: ReturnType<typeof useAppState>["sessions"];
  onTalk: () => void;
}) {
  const R = 54;
  const C = 2 * Math.PI * R;

  return (
    <div className="pb-1">
      {/* Meter */}
      <div className="mt-4 flex items-center gap-4 rounded-xl2 bg-warmth-50 p-4">
        <div className="relative h-[124px] w-[124px] shrink-0">
          <svg viewBox="0 0 124 124" className="h-full w-full -rotate-90">
            <circle cx="62" cy="62" r={R} fill="none" strokeWidth="11" className="stroke-linen-200" />
            <circle
              cx="62"
              cy="62"
              r={R}
              fill="none"
              strokeWidth="11"
              strokeLinecap="round"
              className="stroke-warmth-500 transition-all duration-1000"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - progress.percent / 100)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-[28px] leading-none text-dusk-900">{progress.percent}%</span>
            <span className="mt-0.5 text-[11px] text-dusk-500">confidence</span>
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-warmth-600">
            Level {progress.current.level}
          </p>
          <p className="font-display text-[19px] leading-tight text-dusk-900">{progress.current.name}</p>
          <p className="mt-1.5 text-[13px] text-dusk-700">{progress.minutes} min talked so far</p>
          {progress.next ? (
            <p className="mt-0.5 text-[12.5px] text-dusk-500">
              {progress.minutesToNext} more min to reach <b>{progress.next.name}</b>
            </p>
          ) : (
            <p className="mt-0.5 text-[12.5px] text-sage-500">Top level reached. Amazing!</p>
          )}
        </div>
      </div>

      {/* Level path */}
      <h3 className="mt-6 text-[14px] font-semibold text-dusk-900">How confidence grows</h3>
      <p className="mt-1 text-[13px] leading-relaxed text-dusk-500">
        Every minute you talk is XP. The more you speak, the more natural it feels, and that carries into
        real life.
      </p>
      <ol className="mt-3">
        {CONFIDENCE_LEVELS.map((l, i) => {
          const reached = progress.minutes >= l.minutes;
          const isCurrent = l.level === progress.current.level;
          const LevelIcon = LEVEL_ICONS[i];
          return (
            <li key={l.level} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                    reached ? "bg-warmth-500 text-white" : "bg-linen-200 text-dusk-400"
                  } ${isCurrent ? "ring-4 ring-warmth-500/25" : ""}`}
                >
                  {reached ? <LevelIcon size={18} weight="fill" /> : <Lock size={15} />}
                </span>
                {i < CONFIDENCE_LEVELS.length - 1 && (
                  <span className={`my-0.5 w-0.5 flex-1 ${progress.minutes >= CONFIDENCE_LEVELS[i + 1].minutes ? "bg-warmth-500" : "bg-linen-200"}`} />
                )}
              </div>
              <div className="pb-4">
                <p className={`text-[14px] font-semibold ${reached ? "text-dusk-900" : "text-dusk-400"}`}>
                  {l.name}
                  {isCurrent && <span className="ml-2 rounded-full bg-warmth-50 px-2 py-0.5 text-[10.5px] font-medium text-warmth-600">You are here</span>}
                </p>
                <p className="text-[12px] text-dusk-400">{l.minutes === 0 ? "Where everyone starts" : `Talk ${l.minutes} min in total`}</p>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Scenarios */}
      <h3 className="mt-2 text-[14px] font-semibold text-dusk-900">Talk in different scenarios</h3>
      <p className="mt-1 text-[13px] leading-relaxed text-dusk-500">
        Each new situation you practise teaches your mind that talking is safe. Unlock a badge for every
        scenario.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {SCENARIO_BADGES.map((b) => {
          const got = b.unlocked(sessions);
          return (
            <div
              key={b.id}
              className={`rounded-xl2 border p-3 text-center ${
                got ? "border-warmth-500/40 bg-warmth-50" : "border-linen-200 bg-linen-100"
              }`}
            >
              <span
                className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full ${
                  got ? "bg-warmth-500 text-white" : "bg-linen-200 text-dusk-400"
                }`}
              >
                {got ? <Trophy size={22} weight="fill" /> : <Lock size={18} />}
              </span>
              <p className={`mt-2 text-[13px] font-semibold ${got ? "text-dusk-900" : "text-dusk-700"}`}>{b.title}</p>
              <p className="mt-0.5 text-[11.5px] leading-snug text-dusk-400">{got ? "Unlocked!" : b.hint}</p>
            </div>
          );
        })}
      </div>

      {/* Topics */}
      <h3 className="mt-6 text-[14px] font-semibold text-dusk-900">What to talk about</h3>
      <div className="mt-3 flex flex-col gap-2">
        {TOPIC_TIPS.map(({ icon: TopicIcon, title, tip }) => (
          <div key={title} className="flex items-center gap-3 rounded-xl2 bg-linen-100 p-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card text-warmth-500">
              <TopicIcon size={18} weight="fill" />
            </span>
            <div>
              <p className="text-[13.5px] font-semibold text-dusk-900">{title}</p>
              <p className="text-[12px] text-dusk-500">{tip}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <PrimaryButton onClick={onTalk}>Start talking · chat is free</PrimaryButton>
      </div>
    </div>
  );
}
