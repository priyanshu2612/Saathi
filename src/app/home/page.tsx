"use client";

import { useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import CoinBadge from "@/components/ui/CoinBadge";
import Logo from "@/components/ui/Logo";
import BottomNav from "@/components/ui/BottomNav";
import { PopularGridCard, MentorListCard } from "@/components/mentor/MentorCard";
import HomeBannerCarousel from "@/components/home/HomeBannerCarousel";
import { MOOD_TAGS } from "@/lib/types";
import { HomeFilter, useAppState } from "@/lib/store";

const FILTER_ICONS: Record<HomeFilter, string> = {
  all: "/mood-icons/all.png",
  stress: "/mood-icons/stress.png",
  loneliness: "/mood-icons/loneliness.png",
  breakup: "/mood-icons/breakup.png",
  work: "/mood-icons/work.png",
  just_talk: "/mood-icons/just-talk.png",
  fun: "/mood-icons/fun.png",
  flirt: "/mood-icons/flirt.png",
  friend: "/mood-icons/friend.png",
};

// Short, similar-length labels for the icon tab bar — MOOD_TAGS keeps the
// longer, descriptive labels used elsewhere (onboarding, mentor tagging).
const FILTER_LABELS: Record<HomeFilter, string> = {
  all: "All",
  stress: "Stress",
  loneliness: "Lonely",
  breakup: "Breakup",
  work: "Workload",
  just_talk: "Talk",
  fun: "Fun",
  flirt: "Flirt",
  friend: "Friend",
};

const FILTER_PILLS: { id: HomeFilter; label: string }[] = [
  { id: "all", label: FILTER_LABELS.all },
  ...MOOD_TAGS.map((t) => ({ id: t.id as HomeFilter, label: FILTER_LABELS[t.id as HomeFilter] })),
];

export default function HomePage() {
  const router = useRouter();
  const { mentors, homeFilter, setHomeFilter, coinBalance, checkInsThisWeek, recordCheckIn } =
    useAppState();

  const popular = useMemo(() => {
    const flagged = mentors.filter((m) => m.popular || m.rising);
    const rest = mentors
      .filter((m) => !flagged.includes(m))
      .sort((a, b) => b.rating - a.rating);
    return [...flagged, ...rest].slice(0, 8);
  }, [mentors]);

  const filtered = useMemo(() => {
    const list =
      homeFilter === "all" ? mentors : mentors.filter((m) => m.tags.includes(homeFilter));
    return [...list].sort((a, b) => Number(b.isOnline) - Number(a.isOnline));
  }, [mentors, homeFilter]);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex items-center justify-between px-5 pt-6">
        <button
          type="button"
          onClick={() => router.push("/partner")}
          aria-label="Mentor sign-in"
          className="tap-target -m-1 p-1"
        >
          <Logo className="h-7 w-auto" />
        </button>
        <CoinBadge balance={coinBalance} />
      </div>

      <div className="mt-4 border-b border-linen-200">
        <div className="no-scrollbar flex gap-5 overflow-x-auto px-5">
          {FILTER_PILLS.map((pill) => {
            const selected = homeFilter === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => setHomeFilter(pill.id)}
                className="tap-target relative flex shrink-0 flex-col items-center gap-1.5 pb-2.5"
              >
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl2">
                  <Image
                    src={FILTER_ICONS[pill.id]}
                    alt={pill.label}
                    width={40}
                    height={40}
                    className="h-10 w-10 object-cover"
                  />
                </div>
                <span
                  className={`whitespace-nowrap text-[13px] transition-colors ${
                    selected ? "font-semibold text-dusk-900" : "font-medium text-dusk-400"
                  }`}
                >
                  {pill.label}
                </span>
                {selected && (
                  <span className="absolute inset-x-0 -bottom-px h-[3px] rounded-full bg-warmth-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <HomeBannerCarousel />
      </div>

      <button
        onClick={recordCheckIn}
        className="tap-target mx-5 mt-4 rounded-xl2 bg-linen-100 px-4 py-2.5 text-left text-[13px] text-dusk-700"
      >
        You&apos;ve checked in with yourself{" "}
        <span className="font-semibold text-sage-500">{checkInsThisWeek} day{checkInsThisWeek === 1 ? "" : "s"}</span>{" "}
        this week
      </button>

      <div className="mt-6">
        <h2 className="px-5 text-[20px] font-bold text-dusk-900">Popular right now</h2>
        <div className="no-scrollbar mt-3 overflow-x-auto px-5 pb-1">
          <div className="grid w-max grid-flow-col grid-rows-2 gap-3.5">
            {popular.map((mentor) => (
              <PopularGridCard key={mentor.id} mentor={mentor} />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-7 flex-1 px-5 pb-6">
        <h2 className="text-[20px] font-bold text-dusk-900">
          {homeFilter === "all" ? "Everyone here" : "Matched for you"}
        </h2>
        <div className="mt-3 flex flex-col gap-3">
          {filtered.map((mentor) => (
            <MentorListCard key={mentor.id} mentor={mentor} />
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
