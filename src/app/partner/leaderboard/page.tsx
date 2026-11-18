"use client";

import { LeaderboardCard } from "@/components/saathi/SaathiStats";
import MentorBottomNav from "@/components/ui/MentorBottomNav";

export default function MentorLeaderboardPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="px-5 pt-6">
        <h1 className="font-display text-[22px] text-dusk-900">Leaderboard</h1>
        <p className="mt-1 text-[13px] text-dusk-400">Who has been online the most today</p>
      </div>
      <LeaderboardCard />
      <div className="mt-auto" />
      <MentorBottomNav />
    </div>
  );
}
