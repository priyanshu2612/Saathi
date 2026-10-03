"use client";

import { useEffect, useState } from "react";
import { Users } from "@phosphor-icons/react";
import { RECENT_SAATHIS, REGISTERED_LAST_24H } from "@/lib/social-proof";

const ROTATE_MS = 4000;

/** "40+ registered in the last 24 hours" plus a rotating "Name, age from City registered on Day" line. */
export default function SocialProof({ className = "" }: { className?: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (RECENT_SAATHIS.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % RECENT_SAATHIS.length), ROTATE_MS);
    return () => clearInterval(t);
  }, []);

  const current = RECENT_SAATHIS[index];

  return (
    <div className={`rounded-xl2 bg-warmth-50 px-4 py-3 ${className}`}>
      <p className="flex items-center gap-2 text-[13px] font-semibold text-dusk-900">
        <Users size={16} weight="fill" className="shrink-0 text-warmth-500" />
        {REGISTERED_LAST_24H} people registered in the last 24 hours
      </p>
      {current && (
        <p
          key={index}
          className="mt-1 flex animate-fadeIn items-center gap-2 text-[12.5px] text-dusk-700"
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-sage-500" />
          </span>
          <span>
            <span className="font-medium">
              {current.firstName}, {current.age}
            </span>{" "}
            from {current.city} registered {current.day ? `on ${current.day}` : "recently"}
          </span>
        </p>
      )}
    </div>
  );
}
