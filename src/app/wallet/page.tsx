"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  ArrowUp,
  ArrowDown,
  ArrowsClockwise,
  Gift,
  ShieldCheck,
  Timer,
  Headset,
  Receipt,
  Prohibit,
} from "@phosphor-icons/react";
import BottomNav from "@/components/ui/BottomNav";
import { useAppState } from "@/lib/store";
import { COIN_PACKS } from "@/lib/mock-data";
import { formatDateTime } from "@/lib/format";

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

const TRUST_POINTS = [
  { icon: ShieldCheck, text: "Secure payments, verified by Razorpay" },
  { icon: Timer, text: "Coins are only deducted once your call connects" },
  { icon: Headset, text: "24×7 real human support — never a bot" },
  { icon: Receipt, text: "Every purchase gets a clear, itemized receipt" },
  { icon: Prohibit, text: "No hidden fees, no auto-renewals, ever" },
];

const PACK_TAGS: Record<string, string> = {
  p2: "Popular",
  p4: "Best Value",
};

const BASE_RATE = COIN_PACKS[0].coins / COIN_PACKS[0].priceInr;

function bonusCoins(pack: (typeof COIN_PACKS)[number]) {
  return Math.max(0, pack.coins - Math.round(pack.priceInr * BASE_RATE));
}

const TX_LABEL: Record<string, { label: string; icon: typeof ArrowUp }> = {
  purchase: { label: "Coins purchased", icon: ArrowUp },
  session_spend: { label: "Conversation", icon: ArrowDown },
  session_earning: { label: "Earnings", icon: ArrowUp },
  refund: { label: "Refund", icon: ArrowUp },
  free_credit: { label: "Welcome credit", icon: Gift },
};

export default function WalletPage() {
  const { coinBalance, transactions, mentors, addCoins } = useAppState();
  const [buying, setBuying] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleBuy = (packId: string, coins: number) => {
    setBuying(packId);
    setTimeout(() => {
      addCoins(coins, "purchase");
      setBuying(null);
    }, 900);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  const { chatMinutes, audioMinutes } = useMemo(() => {
    const avgChatRate = average(mentors.map((m) => m.rateChat));
    const avgAudioRate = average(mentors.map((m) => m.rateAudio));
    return {
      chatMinutes: avgChatRate > 0 ? Math.floor(coinBalance / avgChatRate) : 0,
      audioMinutes: avgAudioRate > 0 ? Math.floor(coinBalance / avgAudioRate) : 0,
    };
  }, [mentors, coinBalance]);

  const lifetimePurchased = useMemo(
    () =>
      transactions
        .filter((tx) => tx.type === "purchase")
        .reduce((sum, tx) => sum + tx.amount, 0),
    [transactions]
  );

  return (
    <div className="flex min-h-screen flex-col">
      <div className="px-5 pt-6">
        <h1 className="font-display text-[22px] text-dusk-900">Wallet</h1>
      </div>

      <div className="px-5 pt-4">
        <div className="relative overflow-hidden rounded-xl3 bg-gradient-to-br from-warmth-400 to-warmth-700 p-4">
          <div className="pointer-events-none absolute -right-6 -top-10 h-32 w-32 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-10 -left-6 h-24 w-24 rounded-full bg-white/10" />

          <div className="relative flex items-start justify-between">
            <p className="text-[13px] text-white/80">Available Balance</p>
            <button
              type="button"
              onClick={handleRefresh}
              aria-label="Refresh balance"
              className="tap-target flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white"
            >
              <ArrowsClockwise size={14} weight="bold" className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="relative mt-1.5 flex items-center gap-2">
            <Image src="/coinstack.png" alt="" width={40} height={40} className="h-10 w-10 object-contain" />
            <span className="font-display text-[34px] leading-none text-white">{coinBalance}</span>
          </div>

          <p className="relative mt-1.5 text-[13px] text-white/80">
            ≈ {chatMinutes} min chat · {audioMinutes} min voice call
          </p>

          {lifetimePurchased > 0 && (
            <div className="relative mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-2 text-[13px] font-medium text-white">
              <Gift size={15} weight="fill" />
              {lifetimePurchased} coins recharged
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 px-5">
        <h2 className="text-[20px] font-bold text-dusk-900">Add more time</h2>
        <div className="mt-4 flex flex-col gap-4">
          {COIN_PACKS.map((pack) => {
            const tag = PACK_TAGS[pack.id];
            const bonus = bonusCoins(pack);
            return (
              <div
                key={pack.id}
                className={`relative flex items-center justify-between rounded-xl2 border border-linen-200 bg-linen-100 px-4 py-3 ${
                  tag ? "mt-2.5" : ""
                }`}
              >
                {tag && (
                  <span className="absolute -top-2.5 left-3 rounded-full bg-warmth-500 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    {tag}
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <Image
                    src="/moneybag.png"
                    alt=""
                    width={32}
                    height={32}
                    className="h-8 w-8 shrink-0 object-contain"
                  />
                  <div>
                    <p className="text-[15px] font-semibold text-dusk-900">
                      {pack.coins} coins
                    </p>
                    <p className="text-[12px] text-dusk-400">{pack.bonusLabel}</p>
                    {bonus > 0 && (
                      <p className="text-[12px] font-medium text-sage-500">
                        +{bonus} extra coins
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleBuy(pack.id, pack.coins)}
                  disabled={buying === pack.id}
                  className="tap-target shrink-0 rounded-full bg-warmth-500 px-4 py-2 text-[13px] font-medium text-white disabled:opacity-60"
                >
                  {buying === pack.id ? "Adding…" : `₹${pack.priceInr}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 px-5">
        <div className="flex flex-col gap-2.5 rounded-xl2 bg-linen-100 p-4">
          {TRUST_POINTS.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2.5">
              <Icon size={16} weight="fill" className="shrink-0 text-sage-500" />
              <p className="text-[12.5px] text-dusk-700">{text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-7 flex-1 px-5 pb-6">
        <h2 className="text-[20px] font-bold text-dusk-900">History</h2>
        <div className="mt-3 flex flex-col gap-2">
          {transactions.map((tx) => {
            const meta = TX_LABEL[tx.type];
            const Icon = meta.icon;
            return (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-xl2 bg-linen-100 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} className="text-dusk-400" />
                  <div>
                    <p className="text-[13px] font-medium text-dusk-800">{meta.label}</p>
                    <p className="text-[11px] text-dusk-400">
                      {formatDateTime(tx.createdAt)}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[13px] font-semibold ${
                    tx.amount > 0 ? "text-sage-500" : "text-dusk-700"
                  }`}
                >
                  {tx.amount > 0 ? "+" : ""}
                  {tx.amount}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
