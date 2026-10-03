"use client";

import { useState } from "react";
import Image from "next/image";
import { Coins } from "@phosphor-icons/react";
import BottomSheet from "@/components/ui/BottomSheet";
import { Gift, GIFTS } from "@/lib/gifts";

/** Carousel of gifts a seeker can send the Saathi mid-call. */
export default function GiftSheet({
  open,
  onClose,
  mentorName,
  coinBalance,
  onSend,
  onNeedTopUp,
}: {
  open: boolean;
  onClose: () => void;
  mentorName: string;
  coinBalance: number;
  onSend: (gift: Gift) => Promise<{ ok: boolean; error?: string }>;
  onNeedTopUp: () => void;
}) {
  const [selectedId, setSelectedId] = useState(GIFTS[0].id);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = GIFTS.find((g) => g.id === selectedId)!;
  const affordable = coinBalance >= selected.coins;

  const handleSend = async () => {
    if (!affordable) {
      onNeedTopUp();
      return;
    }
    setSending(true);
    setError(null);
    const result = await onSend(selected);
    setSending(false);
    if (!result.ok) setError(result.error ?? "Couldn't send the gift.");
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={`Send a gift to ${mentorName}`}>
      <p className="mt-1 flex items-center gap-1 text-[13px] text-dusk-400">
        <Coins size={14} weight="fill" className="text-gold-500" />
        You have {coinBalance} coins
      </p>

      <div className="no-scrollbar -mx-5 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2">
        {GIFTS.map((gift) => {
          const active = gift.id === selectedId;
          return (
            <button
              key={gift.id}
              type="button"
              onClick={() => {
                setSelectedId(gift.id);
                setError(null);
              }}
              className={`tap-target flex w-[104px] shrink-0 snap-start flex-col items-center rounded-xl2 border px-2 pb-3 pt-2 transition ${
                active ? "border-warmth-500 bg-warmth-50" : "border-linen-200 bg-linen-50"
              }`}
            >
              <div className="relative h-20 w-20">
                <Image src={gift.image} alt={gift.name} fill sizes="80px" className="object-contain" />
              </div>
              <span className="mt-1 text-[13px] font-medium text-dusk-900">{gift.name}</span>
              <span className="mt-0.5 flex items-center gap-1 text-[12px] font-semibold text-dusk-700">
                <Coins size={12} weight="fill" className="text-gold-500" />
                {gift.coins}
              </span>
            </button>
          );
        })}
      </div>

      {error && <p className="mt-2 text-center text-[13px] text-warmth-600">{error}</p>}

      <button
        type="button"
        onClick={handleSend}
        disabled={sending}
        className="tap-target mt-4 w-full rounded-[12px] bg-warmth-500 px-5 py-3.5 text-[15px] font-medium text-white shadow-warm-sm transition active:scale-[0.98] disabled:opacity-60"
      >
        {sending
          ? "Sending…"
          : affordable
            ? `Send ${selected.name} · ${selected.coins} coins`
            : `Top up to send ${selected.name}`}
      </button>
    </BottomSheet>
  );
}
