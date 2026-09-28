"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, ChatCircleDots, Phone, VideoCamera, ShieldCheck } from "@phosphor-icons/react";
import { Mentor } from "@/lib/types";
import { useAppState } from "@/lib/store";

function OnlineDot({ online }: { online: boolean }) {
  return (
    <span
      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
        // The pulse animation bakes its own ring into the keyframes (see
        // tailwind.config.ts) so it doesn't fight the static ring-2 utility
        // for the box-shadow property mid-animation.
        online ? "bg-sage-400 animate-pulseSage" : "bg-dusk-400 ring-2 ring-linen-50"
      }`}
    />
  );
}

function formatRate(coins: number) {
  return coins <= 0 ? "Free" : `${coins}/min`;
}

// Card used in the horizontally-scrolling "Popular right now" rail —
// photo-forward, name + rating + age/language line, with a quick video-call
// shortcut so a Seeker can jump straight into a call without opening the
// full profile first.
export function PopularGridCard({ mentor }: { mentor: Mentor }) {
  const { coinBalance } = useAppState();
  const canAffordVideo = coinBalance >= mentor.rateVideo;
  const badge = mentor.popular ? "Popular" : mentor.rising ? "Rising" : null;
  return (
    <div className="w-[150px] shrink-0">
      <div className="relative">
        <Link href={`/mentor/${mentor.id}`} className="tap-target block">
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl3">
            <Image
              src={mentor.photoUrl}
              alt={mentor.name}
              fill
              sizes="150px"
              className="object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />
            {badge && (
              <span className="absolute right-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[10px] font-medium text-black">
                {badge === "Popular" ? "⭐" : "🌱"}
              </span>
            )}
            <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center gap-1.5 text-white">
              <OnlineDot online={mentor.isOnline} />
              <span className="font-display truncate text-[14px]">{mentor.name}</span>
            </div>
          </div>
        </Link>
        <Link
          href={
            canAffordVideo
              ? `/session/new?mentorId=${mentor.id}&mode=video`
              : `/mentor/${mentor.id}?mode=video`
          }
          aria-label={`Video call ${mentor.name}`}
          className="tap-target absolute -bottom-3 -right-2 flex h-11 w-11 items-center justify-center rounded-full bg-warmth-500 text-white shadow-warm ring-4 ring-linen-50"
        >
          <VideoCamera size={18} weight="fill" />
        </Link>
      </div>
      <div className="mt-3.5 flex items-center justify-between">
        <span className="flex items-center gap-1 text-[11px] text-[#858585]">
          {mentor.age} · {mentor.languages[0]}
        </span>
        <span className="flex items-center gap-0.5 text-[11px] text-dusk-700">
          <Star size={11} weight="fill" className="text-warmth-500" />
          {mentor.rating.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

const RATE_STYLES = {
  chat: {
    icon: ChatCircleDots,
    bg: "bg-amber-50 dark:bg-amber-400/10",
    fg: "text-amber-600 dark:text-amber-300",
    fill: false,
  },
  audio: {
    icon: Phone,
    bg: "bg-sky-50 dark:bg-sky-400/10",
    fg: "text-sky-600 dark:text-sky-300",
    fill: false,
  },
  video: { icon: VideoCamera, bg: "bg-warmth-500", fg: "text-white", fill: true },
} as const;

function RateChip({ mode, coins }: { mode: keyof typeof RATE_STYLES; coins: number }) {
  const { icon: Icon, bg, fg, fill } = RATE_STYLES[mode];
  return (
    <div className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg ${bg} py-1.5`}>
      <Icon size={14} weight={fill ? "fill" : "regular"} className={fg} />
      <span className={`text-[11px] font-semibold ${fg}`}>{formatRate(coins)}</span>
    </div>
  );
}

// Full-width list card — avatar, tagline, rating, age/languages, and
// per-mode rate chips spanning the full card width beneath.
export function MentorListCard({ mentor }: { mentor: Mentor }) {
  return (
    <Link
      href={`/mentor/${mentor.id}`}
      className="tap-target flex gap-3.5 rounded-xl3 border border-linen-200 bg-card p-3.5"
    >
      <div className="relative w-[88px] shrink-0 self-stretch overflow-hidden rounded-xl2">
        <Image src={mentor.photoUrl} alt={mentor.name} fill sizes="88px" className="object-cover" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
        <div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="font-display text-[16px] text-dusk-900">{mentor.name}</span>
              <ShieldCheck size={14} weight="fill" className="text-sage-400" />
              <OnlineDot online={mentor.isOnline} />
            </span>
            <span className="flex items-center gap-0.5 text-[12px] text-dusk-700">
              <Star size={12} weight="fill" className="text-warmth-500" />
              {mentor.rating.toFixed(1)}
            </span>
          </div>
          <p className="truncate text-[12px] text-[#858585]">{mentor.tagline}</p>
          <p className="text-[11px] text-[#858585]">
            {mentor.age} · {mentor.languages.join(", ")}
          </p>
        </div>
        <div className="flex gap-1.5">
          <RateChip mode="chat" coins={mentor.rateChat} />
          <RateChip mode="audio" coins={mentor.rateAudio} />
          <RateChip mode="video" coins={mentor.rateVideo} />
        </div>
      </div>
    </Link>
  );
}
