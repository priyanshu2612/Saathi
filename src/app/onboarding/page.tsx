"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Chip from "@/components/ui/Chip";
import PrimaryButton from "@/components/ui/PrimaryButton";
import ConversationIllustration from "@/components/ui/ConversationIllustration";
import { MOOD_TAGS } from "@/lib/types";
import type { MoodTag } from "@/lib/types";
import { useAppState } from "@/lib/store";
import { FREE_TRIAL_COINS } from "@/lib/mock-data";

export default function OnboardingPage() {
  const router = useRouter();
  const { setTags } = useAppState();
  const [selected, setSelected] = useState<MoodTag[]>([]);

  const toggle = (tag: MoodTag) => {
    setSelected((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleContinue = () => {
    setTags(selected);
    router.push("/home");
  };

  return (
    <div className="flex min-h-screen flex-col px-6 pb-8 pt-14">
      <div className="flex justify-center">
        <ConversationIllustration className="h-28 w-40" />
      </div>

      <h1 className="mt-6 text-center font-display text-[28px] leading-tight text-dusk-900">
        What&apos;s on your mind today?
      </h1>
      <p className="mt-2 text-center text-[14px] text-dusk-400">
        No judgment. No performance. Just a real conversation, whenever you need one.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-2.5">
        {MOOD_TAGS.map((tag) => (
          <Chip
            key={tag.id}
            label={tag.label}
            size="lg"
            selected={selected.includes(tag.id)}
            onClick={() => toggle(tag.id)}
          />
        ))}
      </div>

      <div className="mt-auto pt-10">
        <div className="mb-4 rounded-xl2 bg-linen-100 px-4 py-3 text-center text-[13px] text-dusk-700">
          Start with <span className="font-semibold text-warmth-500">{FREE_TRIAL_COINS} free coins</span> — see how it feels before you spend anything.
        </div>
        <PrimaryButton onClick={handleContinue}>
          {selected.length ? "Find my person" : "Just show me who's here"}
        </PrimaryButton>
      </div>
    </div>
  );
}
