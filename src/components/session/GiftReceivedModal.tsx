"use client";

import Image from "next/image";

/** Blocking modal shown to a Saathi when a seeker sends a gift mid-call. */
export default function GiftReceivedModal({
  image,
  giftName,
  from,
  coins,
  remaining,
  onClose,
}: {
  image: string;
  giftName: string;
  from: string;
  coins: number;
  remaining: number;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm"
    >
      <div className="flex w-full max-w-xs animate-giftPop flex-col items-center rounded-3xl bg-white px-6 py-7 text-center text-dusk-900 shadow-float">
        <div className="relative h-28 w-28">
          <Image src={image} alt={giftName} fill sizes="112px" className="object-contain" />
        </div>
        <p className="mt-3 font-display text-[20px]">{from} sent you a gift!</p>
        <p className="mt-1 text-[15px] font-medium">{giftName}</p>
        <p className="mt-2 rounded-full bg-sage-400/15 px-3 py-1 text-[13px] font-semibold text-sage-600">
          +{coins} coins added to your earnings
        </p>
        <button
          onClick={onClose}
          className="tap-target mt-5 w-full rounded-full bg-warmth-500 py-3 text-[14px] font-medium text-white"
        >
          {remaining > 0 ? `Thank you (${remaining} more)` : "Thank you"}
        </button>
      </div>
    </div>
  );
}
