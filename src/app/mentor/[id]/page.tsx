"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Star,
  ShieldCheck,
  Heart,
  ChatCircleDots,
  Phone,
  VideoCamera,
} from "@phosphor-icons/react";
import ScreenHeader from "@/components/ui/ScreenHeader";
import PrimaryButton from "@/components/ui/PrimaryButton";
import MediaGallery from "@/components/mentor/MediaGallery";
import { PersonalDetails, AboutSection } from "@/components/mentor/MentorDetails";
import { useAppState } from "@/lib/store";
import { SessionMode } from "@/lib/types";

const MODES: { id: SessionMode; label: string; icon: typeof ChatCircleDots }[] = [
  { id: "chat", label: "Chat", icon: ChatCircleDots },
  { id: "audio", label: "Audio", icon: Phone },
  { id: "video", label: "Video", icon: VideoCamera },
];

export default function MentorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mentors, isSaved, toggleSaveMentor, coinBalance } = useAppState();
  const mentor = mentors.find((m) => m.id === id);
  const requestedMode = searchParams.get("mode") as SessionMode | null;
  const [mode, setMode] = useState<SessionMode>(
    requestedMode && ["chat", "audio", "video"].includes(requestedMode) ? requestedMode : "chat"
  );

  if (!mentor) {
    return (
      <div className="p-6">
        <p className="text-dusk-700">This mentor couldn&apos;t be found.</p>
      </div>
    );
  }

  const saved = isSaved(mentor.id);
  const rateByMode: Record<SessionMode, number> = {
    chat: mentor.rateChat,
    audio: mentor.rateAudio,
    video: mentor.rateVideo,
  };
  const activeRate = rateByMode[mode];
  const canAfford = coinBalance >= activeRate;

  return (
    <div className="flex min-h-screen flex-col">
      <MediaGallery
        photos={mentor.photos}
        videos={mentor.videos}
        alt={mentor.name}
        heroOverlay={
          <>
            <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/50 to-transparent">
              <ScreenHeader
                transparent
                right={
                  <button
                    onClick={() => toggleSaveMentor(mentor.id)}
                    className="tap-target flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-black"
                    aria-label="Save mentor"
                  >
                    <Heart
                      size={18}
                      weight={saved ? "fill" : "regular"}
                      className={saved ? "text-warmth-500" : ""}
                    />
                  </button>
                }
              />
            </div>
            <span
              className={`absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium text-white ${
                mentor.isOnline ? "bg-sage-500" : "bg-black/60"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${mentor.isOnline ? "bg-white" : "bg-white/60"}`} />
              {mentor.isOnline ? "Online" : "Offline"}
            </span>
          </>
        }
      />

      <div className="flex-1 px-5 pt-5">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-[26px] text-dusk-900">{mentor.name}</h1>
          <ShieldCheck size={20} weight="fill" className="text-sage-400" />
        </div>
        <p className="mt-0.5 text-[14px] text-dusk-400">{mentor.tagline}</p>
        <div className="mt-1.5 flex items-center gap-3 text-[13px] text-dusk-400">
          <span className="flex items-center gap-1 text-dusk-700">
            <Star size={14} weight="fill" className="text-warmth-500" />
            {mentor.rating.toFixed(1)} · {mentor.sessionCount} conversations
          </span>
          <span>{mentor.languages.join(", ")}</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {mentor.tags.map((t) => (
            <span key={t} className="rounded-full bg-linen-100 px-3 py-1.5 text-[12px] font-medium text-dusk-700">
              {t.replace("_", " ")}
            </span>
          ))}
        </div>

        <div className="mt-5 flex gap-2 rounded-xl2 bg-linen-100 p-1.5">
          {MODES.map(({ id: modeId, label, icon: Icon }) => (
            <button
              key={modeId}
              onClick={() => setMode(modeId)}
              className={`tap-target flex flex-1 flex-col items-center gap-1 rounded-xl py-2.5 transition ${
                mode === modeId ? "bg-warmth-500 text-white" : "text-dusk-700"
              }`}
            >
              <Icon size={18} weight={mode === modeId ? "fill" : "regular"} />
              <span className="text-[12px] font-medium">{label}</span>
              <span className={`text-[11px] ${mode === modeId ? "text-white/90" : "text-dusk-400"}`}>
                {rateByMode[modeId] <= 0 ? "Free" : `${rateByMode[modeId]}/min`}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-6">
          <AboutSection mentor={mentor} />
        </div>

        {mentor.boundaries && mentor.boundaries.length > 0 && (
          <div className="mt-4 rounded-xl2 bg-linen-100 p-3.5">
            <p className="text-[12px] font-medium text-dusk-700">Boundaries</p>
            <p className="mt-1 text-[13px] text-dusk-400">{mentor.boundaries.join("; ")}</p>
          </div>
        )}

        <div className="mt-6">
          <PersonalDetails mentor={mentor} />
        </div>

        <div className="h-4" />
      </div>

      <div className="sticky bottom-0 bg-linen-50 px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-3 shadow-float">
        {!canAfford && mentor.isOnline && (
          <p className="mb-2 text-center text-[12px] text-warmth-600">
            You need at least {activeRate} coins to start — top up in Wallet.
          </p>
        )}
        <PrimaryButton
          disabled={!mentor.isOnline}
          onClick={() =>
            canAfford
              ? router.push(`/session/new?mentorId=${mentor.id}&mode=${mode}`)
              : router.push("/wallet")
          }
        >
          {!mentor.isOnline
            ? `${mentor.name} is offline`
            : canAfford
              ? `Talk to ${mentor.name}`
              : "Add coins to continue"}
        </PrimaryButton>
      </div>
    </div>
  );
}
