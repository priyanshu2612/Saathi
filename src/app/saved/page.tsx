"use client";

import { useRouter } from "next/navigation";
import BottomNav from "@/components/ui/BottomNav";
import ConversationIllustration from "@/components/ui/ConversationIllustration";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { MentorListCard } from "@/components/mentor/MentorCard";
import { useAppState } from "@/lib/store";

export default function SavedPage() {
  const router = useRouter();
  const { mentors, savedMentorIds } = useAppState();
  const saved = mentors.filter((m) => savedMentorIds.includes(m.id));

  return (
    <div className="flex min-h-screen flex-col">
      <div className="px-5 pt-6">
        <h1 className="font-display text-[22px] text-dusk-900">Your saved mentors</h1>
      </div>

      {saved.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <ConversationIllustration className="h-28 w-40" />
          <p className="mt-4 font-display text-[18px] text-dusk-900">
            Your first conversation is one tap away
          </p>
          <p className="mt-1 text-[13px] text-dusk-400">
            Save a mentor you liked talking to and they&apos;ll show up here — we&apos;ll let you know when they&apos;re online.
          </p>
          <div className="mt-6 w-full">
            <PrimaryButton onClick={() => router.push("/home")}>Browse mentors</PrimaryButton>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex-1 px-5 pb-6">
          <div className="flex flex-col gap-3">
            {saved.map((mentor) => (
              <MentorListCard key={mentor.id} mentor={mentor} />
            ))}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
