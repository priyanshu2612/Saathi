"use client";

import { useRouter } from "next/navigation";
import { ShieldCheck, ChatCircleDots, HeartStraight } from "@phosphor-icons/react";
import Logo from "@/components/ui/Logo";
import PrimaryButton from "@/components/ui/PrimaryButton";

const REASONS = [
  {
    icon: HeartStraight,
    title: "Someone's always ready to listen",
    body: "No judgment, no performance — just a real conversation, whenever you need one.",
  },
  {
    icon: ShieldCheck,
    title: "Verified, trained listeners",
    body: "Every Saathi is a real, ID-verified person — chosen, trained, and rated.",
  },
  {
    icon: ChatCircleDots,
    title: "Chat, call, or video — your choice",
    body: "Start with a message, upgrade to a call the moment you want to hear a voice.",
  },
];

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col px-6 pt-6 pb-8">
      <div className="flex items-center justify-between">
        <Logo className="h-8 w-auto" />
        <button
          type="button"
          onClick={() => router.push("/saathi")}
          className="tap-target rounded-full border border-linen-200 bg-linen-100 px-4 py-2 text-[13px] font-medium text-dusk-800"
        >
          Join as a Saathi
        </button>
      </div>

      <div className="mt-10">
        <h1 className="font-display text-[30px] leading-tight text-dusk-900">
          Sukoon — a calm conversation, whenever you need one.
        </h1>
        <p className="mt-3 text-[15px] text-dusk-400">
          Talk to a real, verified Saathi over chat, audio or video. Stressed, lonely, or just
          having a rough week — someone&apos;s here to listen.
        </p>
      </div>

      <div className="mt-10 space-y-4">
        {REASONS.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex gap-3.5 rounded-xl3 bg-linen-100 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warmth-50">
              <Icon size={20} className="text-warmth-500" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-dusk-900">{title}</p>
              <p className="mt-0.5 text-[13px] text-dusk-400">{body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-10">
        <PrimaryButton onClick={() => router.push("/signin")}>Join now</PrimaryButton>
        <p className="mt-4 text-center text-[12px] text-dusk-400">
          Free to join. Your first conversation is on us.
        </p>
      </div>
    </div>
  );
}
