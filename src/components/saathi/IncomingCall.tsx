"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChatCircleDots, Timer, VideoCamera } from "@phosphor-icons/react";
import { useAppState } from "@/lib/store";
import { isDemoMode } from "@/lib/supabase/client";
import { getMentorId, IncomingCall, pollIncomingCalls, respondToCall } from "@/lib/data/backend";
import { useRingtone } from "@/lib/useRingtone";
import { useChatInbox } from "@/lib/useChatInbox";
import { seekerAvatarUrl } from "@/lib/format";

/**
 * Rings an online Saathi on any screen, not just the dashboard. Polls for
 * seekers calling them and shows an accept / decline card at the top.
 */
export default function SaathiIncomingCall() {
  const router = useRouter();
  const pathname = usePathname();
  const { mentorOnline } = useAppState();
  const [calls, setCalls] = useState<IncomingCall[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);

  // Already on a call screen: don't ring over it.
  const active = !isDemoMode && mentorOnline && !pathname.startsWith("/partner/call");

  useEffect(() => {
    if (!active) {
      setCalls([]);
      return;
    }
    const mentorId = getMentorId();
    if (!mentorId) return;
    let cancelled = false;
    const tick = () =>
      pollIncomingCalls(mentorId)
        .then((list) => {
          if (!cancelled) setCalls(list);
        })
        .catch(() => {});
    tick();
    const poll = setInterval(tick, 2000);
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      cancelled = true;
      clearInterval(poll);
      clearInterval(clock);
    };
  }, [active]);

  // New chat messages from seekers: a banner on any screen except the chat itself.
  const inbox = useChatInbox(getMentorId(), active && !pathname.startsWith("/partner/chat"));
  const [seen, setSeen] = useState<Record<string, string>>({});
  const newChat = inbox.find((c) => {
    const key = c.last?.id ?? "start";
    if (seen[c.id] === key) return false;
    if (c.last?.mine) return false;
    const at = new Date(c.last?.createdAt ?? c.startedAt).getTime();
    return now - at < 2 * 60 * 1000;
  });
  const openChat = (id: string, key: string) => {
    setSeen((p) => ({ ...p, [id]: key }));
    router.push(`/partner/chat/${id}`);
  };

  const incoming = calls[0];
  useRingtone(Boolean(incoming), incoming ? `${incoming.seekerName} is calling` : "Incoming call");

  const respond = async (call: IncomingCall, action: "accept" | "decline") => {
    const mentorId = getMentorId();
    if (!mentorId) return;
    setError(null);
    try {
      await respondToCall(mentorId, call.id, action);
      setCalls((prev) => prev.filter((c) => c.id !== call.id));
      if (action === "accept") router.push(`/partner/call/${call.id}`);
    } catch (err) {
      setCalls((prev) => prev.filter((c) => c.id !== call.id));
      setError(err instanceof Error ? err.message : "Couldn't answer this call.");
    }
  };

  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] mx-auto w-full max-w-[430px] px-3 pt-3">
      {error && !incoming && (
        <p className="pointer-events-auto rounded-xl2 bg-card p-3 text-[13px] text-warmth-600 shadow-lg">{error}</p>
      )}
      {!incoming && newChat && (
        <button
          onClick={() => openChat(newChat.id, newChat.last?.id ?? "start")}
          className="pointer-events-auto flex w-full items-center gap-3 rounded-xl2 border border-warmth-500/30 bg-warmth-50 p-3.5 text-left shadow-xl"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warmth-500/15 text-warmth-600">
            <ChatCircleDots size={20} weight="fill" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-semibold text-dusk-900">{newChat.seekerName}</span>
            <span className="block truncate text-[13px] text-dusk-700">
              {newChat.last?.body ?? "Started a chat with you"}
            </span>
          </span>
          <span className="rounded-full bg-warmth-500 px-3.5 py-1.5 text-[12px] font-medium text-white">Reply</span>
        </button>
      )}
      {incoming && (
        <div className="pointer-events-auto rounded-xl2 border border-warmth-500/30 bg-warmth-50 p-4 shadow-xl">
          <div className="flex items-center gap-2 text-warmth-700">
            <VideoCamera size={18} weight="fill" />
            <span className="text-[14px] font-semibold">Incoming video call</span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={seekerAvatarUrl(incoming.seekerName)}
              alt={incoming.seekerName}
              className="h-12 w-12 rounded-full object-cover"
            />
            <p className="text-[15px] font-medium text-dusk-900">{incoming.seekerName}</p>
          </div>
          <p className="mt-0.5 text-[13px] text-dusk-700">
            {incoming.topic ? `Topic: ${incoming.topic}` : "Choosing a topic…"}
          </p>
          <div className="mt-1 flex items-center gap-1 text-[12px] text-dusk-400">
            <Timer size={13} /> Ringing {Math.max(0, Math.floor((now - new Date(incoming.startedAt).getTime()) / 1000))}s
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => respond(incoming, "accept")}
              className="tap-target flex-1 rounded-full bg-warmth-500 py-2.5 text-[13px] font-medium text-white"
            >
              Accept
            </button>
            <button
              onClick={() => respond(incoming, "decline")}
              className="tap-target flex-1 rounded-full bg-linen-100 py-2.5 text-[13px] font-medium text-dusk-700"
            >
              Decline
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
