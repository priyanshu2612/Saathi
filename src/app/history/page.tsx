"use client";

import Image from "next/image";
import Link from "next/link";
import { Phone, VideoCamera, ChatCircleDots, Star, CaretRight } from "@phosphor-icons/react";
import BottomNav from "@/components/ui/BottomNav";
import ConversationIllustration from "@/components/ui/ConversationIllustration";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { useRouter } from "next/navigation";
import { useAppState } from "@/lib/store";
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

function durationLabel(startedAt: string, endedAt?: string) {
  if (!endedAt) return null;
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  if (totalSeconds < 60) return `${totalSeconds} sec`;
  return `${Math.round(totalSeconds / 60)} min`;
}

export default function HistoryPage() {
  const router = useRouter();
  const { sessions, mentors } = useAppState();

  const rows = sessions
    .map((session) => ({ session, mentor: mentors.find((m) => m.id === session.mentorId) }))
    .filter((row): row is { session: (typeof sessions)[number]; mentor: NonNullable<(typeof row)["mentor"]> } =>
      Boolean(row.mentor)
    );

  return (
    <div className="flex min-h-screen flex-col">
      <div className="px-5 pt-6">
        <h1 className="font-display text-[22px] text-dusk-900">Call History</h1>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <ConversationIllustration className="h-28 w-40" />
          <p className="mt-4 font-display text-[18px] text-dusk-900">No sessions yet</p>
          <p className="mt-1 text-[13px] text-dusk-400">
            Once you talk to a mentor, your past chats and calls will show up here.
          </p>
          <div className="mt-6 w-full">
            <PrimaryButton onClick={() => router.push("/home")}>Browse mentors</PrimaryButton>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex-1 px-5 pb-6">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-warmth-500">
            Recent sessions
          </h2>
          <div className="mt-3 flex flex-col gap-3">
            {rows.map(({ session, mentor }) => {
              const meta = MODE_META[session.mode];
              const Icon = meta.icon;
              const duration = durationLabel(session.startedAt, session.endedAt);
              return (
                <Link
                  key={session.id}
                  href={`/mentor/${mentor.id}`}
                  className="tap-target flex items-center gap-3.5 rounded-xl3 border border-linen-200 bg-card p-3.5"
                >
                  <div className="relative h-14 w-14 shrink-0">
                    <div className="h-full w-full overflow-hidden rounded-xl2">
                      <Image
                        src={mentor.photoUrl}
                        alt={mentor.name}
                        fill
                        sizes="56px"
                        className="rounded-xl2 object-cover"
                      />
                    </div>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full text-white ring-2 ring-card ${meta.dotClass}`}
                    >
                      <Icon size={11} weight="fill" />
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-display text-[15px] text-dusk-900">{mentor.name}</span>
                      <span className="shrink-0 text-[11px] text-dusk-400">{formatDateTime(session.startedAt)}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.badgeClass}`}>
                        {meta.label}
                      </span>
                      {duration && <span className="text-[11px] text-dusk-400">{duration}</span>}
                      {session.status === "completed" && session.totalCoinsCharged > 0 && (
                        <span className="text-[11px] font-semibold text-warmth-500">
                          -{session.totalCoinsCharged} coins
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          size={11}
                          weight={n <= Math.round(mentor.rating) ? "fill" : "regular"}
                          className={n <= Math.round(mentor.rating) ? "text-warmth-500" : "text-linen-200"}
                        />
                      ))}
                    </div>
                  </div>

                  <CaretRight size={16} className="shrink-0 text-dusk-400" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
