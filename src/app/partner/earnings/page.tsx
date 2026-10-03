"use client";

import Image from "next/image";
import { Phone, VideoCamera, ChatCircleDots, Coins, Gift as GiftIcon } from "@phosphor-icons/react";
import MentorBottomNav from "@/components/ui/MentorBottomNav";
import { MOCK_INBOUND_SESSIONS } from "@/lib/mock-data";
import { coinsToInr, formatDateTime, formatInr } from "@/lib/format";
import { useAppState } from "@/lib/store";
import { SessionMode } from "@/lib/types";

const MODE_ICON: Record<SessionMode, typeof Phone> = {
  chat: ChatCircleDots,
  audio: Phone,
  video: VideoCamera,
};

const MODE_LABEL: Record<SessionMode, string> = { chat: "Chat", audio: "Voice", video: "Video" };

export default function MentorEarningsPage() {
  const { mentorEarnings, mentorGifts } = useAppState();
  const sessions = MOCK_INBOUND_SESSIONS;
  const totalCoins = sessions.reduce((sum, s) => sum + s.coinsEarned, 0) + mentorEarnings;

  return (
    <div className="flex min-h-screen flex-col">
      <div className="px-5 pt-6">
        <h1 className="font-display text-[22px] text-dusk-900">Earnings</h1>
      </div>

      <div className="mx-5 mt-4 rounded-xl3 bg-warmth-50 p-5">
        <p className="text-[12px] text-dusk-400">Approximate total earned</p>
        <p className="mt-1 font-display text-[32px] leading-none text-dusk-900">
          ≈ {formatInr(coinsToInr(totalCoins))}
        </p>
        <p className="mt-2 flex items-center gap-1.5 text-[13px] text-dusk-700">
          <Coins size={16} weight="fill" className="text-gold-500" />
          {totalCoins} coins
        </p>
        <p className="mt-2 text-[11px] text-dusk-400">
          An estimate based on the average coin value. Final payouts may differ slightly.
        </p>
      </div>

      <div className="flex-1 px-5 pb-6">
        <h2 className="mt-6 text-[13px] font-semibold uppercase tracking-wide text-warmth-500">
          Earnings history
        </h2>
        <div className="mt-3 flex flex-col gap-3">
          {mentorGifts.map((g) => (
            <div
              key={g.id}
              className="flex items-center gap-3.5 rounded-xl3 border border-linen-200 bg-card p-3.5"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-warmth-50 text-warmth-500">
                <GiftIcon size={20} weight="fill" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-[15px] text-dusk-900">{g.giftName} from {g.from}</p>
                <p className="mt-0.5 text-[11px] text-dusk-400">Gift · {formatDateTime(g.createdAt)}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[14px] font-semibold text-sage-500">≈ {formatInr(coinsToInr(g.coins))}</p>
                <p className="text-[11px] text-dusk-400">+{g.coins} coins</p>
              </div>
            </div>
          ))}
          {sessions.map((s) => {
            const Icon = MODE_ICON[s.mode];
            return (
              <div
                key={s.id}
                className="flex items-center gap-3.5 rounded-xl3 border border-linen-200 bg-card p-3.5"
              >
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full">
                  <Image src={s.seekerPhotoUrl} alt={s.seekerName} fill sizes="44px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-[15px] text-dusk-900">{s.seekerName}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-dusk-400">
                    <Icon size={12} weight="fill" />
                    {MODE_LABEL[s.mode]} · {s.durationMin} min · {formatDateTime(s.startedAt)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[14px] font-semibold text-sage-500">≈ {formatInr(coinsToInr(s.coinsEarned))}</p>
                  <p className="text-[11px] text-dusk-400">+{s.coinsEarned} coins</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <MentorBottomNav />
    </div>
  );
}
