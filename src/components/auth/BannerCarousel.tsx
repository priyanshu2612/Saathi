"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, ChatCircleDots, HeartStraight } from "@phosphor-icons/react";

const BANNERS = [
  {
    icon: HeartStraight,
    title: "Someone's always ready to listen",
    body: "No judgment, no performance — just a real conversation, whenever you need one.",
  },
  {
    icon: ShieldCheck,
    title: "Verified, trained listeners",
    body: "Every mentor is a real, ID-verified person — chosen, trained, and rated.",
  },
  {
    icon: ChatCircleDots,
    title: "Chat, call, or video — your choice",
    body: "Start with a message, upgrade to a call the moment you want to hear a voice.",
  },
];

export default function BannerCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % BANNERS.length), 4000);
    return () => clearInterval(t);
  }, []);

  const { icon: Icon, title, body } = BANNERS[index];

  return (
    <div className="rounded-xl3 bg-linen-100 p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warmth-50">
        <Icon size={24} className="text-warmth-500" />
      </div>
      <h2 className="mt-4 font-display text-[20px] leading-snug text-dusk-900">{title}</h2>
      <p className="mt-1.5 text-[13px] text-dusk-400">{body}</p>
      <div className="mt-5 flex gap-1.5">
        {BANNERS.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Show banner ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? "w-6 bg-warmth-500" : "w-1.5 bg-linen-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
