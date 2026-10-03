"use client";

import { useState } from "react";
import Image from "next/image";
import { Gift as GiftIcon } from "@phosphor-icons/react";
import BottomSheet from "@/components/ui/BottomSheet";
import { useAppState } from "@/lib/store";
import { COIN_PACKS, firstRechargeBonus, FIRST_RECHARGE_BONUS_PCT, packExtraCoins } from "@/lib/mock-data";

/** Quick recharge without leaving the call. */
export default function TopUpSheet({
  open,
  onClose,
  reason,
}: {
  open: boolean;
  onClose: () => void;
  reason?: string;
}) {
  const { transactions, purchasePack } = useAppState();
  const [error, setError] = useState<string | null>(null);
  const [buying, setBuying] = useState<string | null>(null);
  const isFirst = !transactions.some((tx) => tx.type === "purchase");

  const handleBuy = async (pack: (typeof COIN_PACKS)[number]) => {
    setBuying(pack.id);
    setError(null);
    const result = await purchasePack(pack);
    setBuying(null);
    if (result.ok) onClose();
    else setError(result.error ?? "Payment failed.");
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Add more time">
      {reason && <p className="mt-1 text-[13px] text-dusk-400">{reason}</p>}

      {isFirst && (
        <div className="mt-3 flex items-center gap-3 rounded-xl2 bg-warmth-50 p-3">
          <Image src="/gifts/surprise-box.png" alt="" width={44} height={44} className="h-11 w-11 shrink-0 object-contain" />
          <p className="text-[13px] font-medium text-dusk-900">
            First recharge bonus: get {FIRST_RECHARGE_BONUS_PCT}% extra coins on any pack.
          </p>
        </div>
      )}

      {error && <p className="mt-2 text-[13px] text-warmth-600">{error}</p>}

      <div className="mt-3 flex flex-col gap-2.5">
        {COIN_PACKS.map((pack) => {
          const extra = packExtraCoins(pack) + (isFirst ? firstRechargeBonus(pack.coins) : 0);
          return (
            <div
              key={pack.id}
              className="flex items-center justify-between rounded-xl2 border border-linen-200 bg-linen-100 px-4 py-3"
            >
              <div>
                <p className="text-[15px] font-semibold text-dusk-900">{pack.coins} coins</p>
                {extra > 0 && (
                  <p className="flex items-center gap-1 text-[12px] font-medium text-sage-500">
                    <GiftIcon size={12} weight="fill" /> +{extra} extra coins
                  </p>
                )}
              </div>
              <button
                onClick={() => handleBuy(pack)}
                disabled={buying !== null}
                className="tap-target shrink-0 rounded-full bg-warmth-500 px-4 py-2 text-[13px] font-medium text-white disabled:opacity-60"
              >
                {buying === pack.id ? "Paying…" : `₹${pack.priceInr}`}
              </button>
            </div>
          );
        })}
      </div>
    </BottomSheet>
  );
}
