"use client";

import Image from "next/image";
import { Phone, VideoCamera, ChatCircleDots } from "@phosphor-icons/react";
import MentorBottomNav from "@/components/ui/MentorBottomNav";
import ConversationIllustration from "@/components/ui/ConversationIllustration";
import { MOCK_INBOUND_SESSIONS } from "@/lib/mock-data";
import { formatDateTime } from "@/lib/format";
import { SessionMode } from "@/lib/types";

const MODE_META: Record<SessionMode, { label: string; icon: typeof Phone; badgeClass: string; dotClass: string }> = {
  chat: {
    label: "Chat",
    icon: ChatCircleDots,
    badgeClass: "bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300",
    dotClass: "bg-amber-500",
  },
  audio: {
    label: "Voice",
    icon: Phone,
    badgeClass: "bg-sky-50 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300",
    dotClass: "bg-sky-500",
  },
  video: {
    label: "Video",
    icon: VideoCamera,
    badgeClass: "bg-pink-50 text-pink-600 dark:bg-pink-400/10 dark:text-pink-300",
    dotClass: "bg-pink-500",
  },
};

export default function MentorHistoryPage() {
  const sessions = MOCK_INBOUND_SESSIONS;
  const totalCoinsEarned = sessions.reduce((sum, s) => sum + s.coinsEarned, 0);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="px-5 pt-6">
        <h1 className="font-display text-[22px] text-dusk-900">Seekers</h1>
      </div>

      {sessions.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <ConversationIllustration className="h-28 w-40" />
          <p className="mt-4 font-display text-[18px] text-dusk-900">No conversations yet</p>
          <p className="mt-1 text-[13px] text-dusk-400">
            Once a Seeker reaches out to you, your chats and calls with them will show up here.
          </p>
        </div>
      ) : (
        <div className="mt-1 flex-1 px-5 pb-6">
          <div className="rounded-xl2 bg-linen-100 px-4 py-3">
            <p className="text-[12px] text-dusk-400">Total earned from Seekers</p>
            <p className="mt-0.5 text-[18px] font-semibold text-dusk-900">{totalCoinsEarned} coins</p>
          </div>

          <h2 className="mt-5 text-[13px] font-semibold uppercase tracking-wide text-warmth-500">
            Recent conversations
          </h2>
          <div className="mt-3 flex flex-col gap-3">
            {sessions.map((s) => {
              const meta = MODE_META[s.mode];
              const Icon = meta.icon;
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-3.5 rounded-xl3 border border-linen-200 bg-card p-3.5"
                >
                  <div className="relative h-14 w-14 shrink-0">
                    <div className="h-full w-full overflow-hidden rounded-xl2">
                      <Image src={s.seekerPhotoUrl} alt={s.seekerName} fill sizes="56px" className="object-cover" />
                    </div>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full text-white ring-2 ring-card ${meta.dotClass}`}
                    >
                      <Icon size={11} weight="fill" />
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-display text-[15px] text-dusk-900">{s.seekerName}</span>
                      <span className="shrink-0 text-[11px] text-dusk-400">{formatDateTime(s.startedAt)}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.badgeClass}`}>
                        {meta.label}
                      </span>
                      <span className="text-[11px] text-dusk-400">{s.durationMin} min</span>
                      <span className="text-[11px] font-semibold text-sage-500">
                        +{s.coinsEarned} coins
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <MentorBottomNav />
    </div>
  );
}
