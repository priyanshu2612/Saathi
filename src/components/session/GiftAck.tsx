"use client";

import Image from "next/image";
import { Gift } from "@/lib/gifts";

/** Centered, auto-fading acknowledgement shown over a call when a gift is sent / received. */
export default function GiftAck({
  gift,
  title,
  subtitle,
}: {
  gift: Pick<Gift, "name" | "image">;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-1/3 z-20 flex justify-center px-6">
      <div className="flex animate-giftPop flex-col items-center rounded-3xl bg-black/60 px-8 py-5 text-center text-white backdrop-blur">
        <div className="relative h-24 w-24">
          <Image src={gift.image} alt={gift.name} fill sizes="96px" className="object-contain" />
        </div>
        <p className="mt-2 text-[15px] font-semibold">{title}</p>
        {subtitle && <p className="mt-0.5 text-[12px] text-white/80">{subtitle}</p>}
      </div>
    </div>
  );
}
