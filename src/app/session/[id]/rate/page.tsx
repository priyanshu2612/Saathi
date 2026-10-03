"use client";

import { useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Star } from "@phosphor-icons/react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Chip from "@/components/ui/Chip";
import { useAppState } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";

const TAGS = ["Felt heard", "Good listener", "Helped me calm down", "Would talk again"];

export default function RateSessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { sessions, mentors, toggleSaveMentor, isSaved } = useAppState();
  const session = sessions.find((s) => s.id === id);
  const mentor = mentors.find((m) => m.id === session?.mentorId);

  const [rating, setRating] = useState(0);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const { showToast } = useToast();

  if (!mentor) {
    router.replace("/home");
    return null;
  }

  const handleSubmit = () => {
    showToast(`Thank you for sharing that. Your feedback helps ${mentor.name}.`);
    router.push("/home");
  };

  return (
    <div className="flex min-h-screen flex-col px-6 pt-16 pb-8">
      <div className="flex flex-col items-center">
        <div className="relative h-20 w-20 overflow-hidden rounded-full">
          <Image src={mentor.photoUrl} alt={mentor.name} fill className="object-cover" />
        </div>
        <h1 className="mt-4 text-center font-display text-[22px] text-dusk-900">
          How did it feel talking to {mentor.name}?
        </h1>

        <div className="mt-5 flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setRating(n)}
              className="tap-target"
              aria-label={`${n} star`}
            >
              <Star
                size={34}
                weight={n <= rating ? "fill" : "regular"}
                className={n <= rating ? "text-warmth-500" : "text-linen-200"}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {TAGS.map((tag) => (
          <Chip key={tag} label={tag} selected={selectedTag === tag} onClick={() => setSelectedTag(tag)} />
        ))}
      </div>

      <button
        onClick={() => toggleSaveMentor(mentor.id)}
        className="tap-target mt-6 text-center text-[13px] font-medium text-dusk-700 underline"
      >
        {isSaved(mentor.id) ? `${mentor.name} is saved to your favorites` : `Save ${mentor.name} for next time`}
      </button>

      <div className="mt-auto pt-10">
        <PrimaryButton disabled={rating === 0} onClick={handleSubmit}>
          Submit
        </PrimaryButton>
        <button
          onClick={() => router.push("/home")}
          className="tap-target mt-3 w-full text-center text-[13px] text-dusk-400"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
