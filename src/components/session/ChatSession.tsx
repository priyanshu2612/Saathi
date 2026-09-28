"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  FlagBanner,
  PaperPlaneRight,
  Phone,
  VideoCamera,
  X,
} from "@phosphor-icons/react";
import { useSessionBilling } from "@/lib/useSessionBilling";
import { useAppState } from "@/lib/store";
import { ChatMessage, Mentor, SessionMode, SessionRecord } from "@/lib/types";

const MENTOR_REPLIES = [
  "I'm here — take your time.",
  "That sounds like a lot to carry. What's weighing on you most right now?",
  "You don't have to have it all figured out to talk about it.",
  "I hear you. Go on, I'm listening.",
  "That makes a lot of sense given what you've described.",
];

export default function ChatSession({
  session,
  mentor,
}: {
  session: SessionRecord;
  mentor: Mentor;
}) {
  const router = useRouter();
  const { coinBalance } = useAppState();
  const { elapsedSeconds, charged, ended, showLowBalance, endNow } = useSessionBilling(
    session,
    mentor
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [switchMode, setSwitchMode] = useState<Extract<SessionMode, "audio" | "video"> | null>(
    null
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      {
        id: "m-intro",
        sender: "mentor",
        text: `Hi, I'm ${mentor.name}. Glad you're here — what's going on?`,
        createdAt: new Date().toISOString(),
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id, mentor.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const minutes = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;

  const handleSend = () => {
    if (!draft.trim() || ended) return;
    const seekerMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "seeker",
      text: draft.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, seekerMsg]);
    setDraft("");
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `mentor-${Date.now()}`,
          sender: "mentor",
          text: MENTOR_REPLIES[Math.floor(Math.random() * MENTOR_REPLIES.length)],
          createdAt: new Date().toISOString(),
        },
      ]);
    }, 1200);
  };

  const handleEnd = () => {
    endNow();
    router.push(`/session/${session.id}/rate`);
  };

  const switchRate = switchMode === "video" ? mentor.rateVideo : mentor.rateAudio;
  const canAffordSwitch = coinBalance >= switchRate;

  const confirmSwitch = () => {
    if (!switchMode) return;
    endNow();
    router.push(`/session/new?mentorId=${mentor.id}&mode=${switchMode}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-linen-50">
      <div className="flex items-center justify-between border-b border-linen-200 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="relative h-9 w-9 overflow-hidden rounded-full">
            <Image src={mentor.photoUrl} alt={mentor.name} fill className="object-cover" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-dusk-900">{mentor.name}</p>
            <p className="text-[11px] text-dusk-400">
              {minutes}:{secs.toString().padStart(2, "0")} · {charged} coins used
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSwitchMode("audio")}
            disabled={ended}
            className="tap-target flex h-8 w-8 items-center justify-center rounded-full bg-linen-100 text-dusk-700 disabled:opacity-40"
            aria-label={`Switch to audio call — ${mentor.rateAudio} coins/min`}
          >
            <Phone size={16} />
          </button>
          <button
            onClick={() => setSwitchMode("video")}
            disabled={ended}
            className="tap-target flex h-8 w-8 items-center justify-center rounded-full bg-linen-100 text-dusk-700 disabled:opacity-40"
            aria-label={`Switch to video call — ${mentor.rateVideo} coins/min`}
          >
            <VideoCamera size={16} />
          </button>
          <button className="tap-target flex h-8 w-8 items-center justify-center rounded-full bg-linen-100 text-dusk-400" aria-label="Report">
            <FlagBanner size={16} />
          </button>
          <button
            onClick={handleEnd}
            className="tap-target flex h-8 w-8 items-center justify-center rounded-full bg-linen-100 text-dusk-700"
            aria-label="End conversation"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {ended && (
        <div className="mx-4 mt-3 rounded-xl2 bg-warmth-50 p-3 text-center text-[13px] text-warmth-700">
          Your balance ran out, so we ended the conversation here. Top up in Wallet to keep talking.
          <button
            onClick={() => router.push(`/session/${session.id}/rate`)}
            className="tap-target mt-2 block w-full rounded-full bg-warmth-500 py-2 text-[13px] font-medium text-white"
          >
            Rate this conversation
          </button>
        </div>
      )}

      {showLowBalance && !ended && (
        <div className="mx-4 mt-3 flex items-center justify-between rounded-xl2 bg-linen-100 p-3">
          <span className="text-[13px] text-dusk-700">You&apos;re running low — want a few more minutes?</span>
          <button
            onClick={() => router.push("/wallet")}
            className="tap-target rounded-full bg-warmth-500 px-3 py-1.5 text-[12px] font-medium text-white"
          >
            Top up
          </button>
        </div>
      )}

      {switchMode && (
        <div className="mx-4 mt-3 rounded-xl2 border border-linen-200 bg-linen-100 p-3.5">
          <p className="text-[13px] text-dusk-800">
            Switch to a <span className="font-semibold">{switchMode}</span> call with {mentor.name}?
            This ends the chat and starts billing at{" "}
            <span className="font-semibold text-dusk-900">{switchRate} coins/min</span>.
          </p>
          {!canAffordSwitch && (
            <p className="mt-1.5 text-[12px] text-warmth-600">
              You need at least {switchRate} coins — top up in Wallet first.
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setSwitchMode(null)}
              className="tap-target flex-1 rounded-full bg-linen-200 py-2 text-[13px] font-medium text-dusk-700"
            >
              Cancel
            </button>
            <button
              onClick={confirmSwitch}
              disabled={!canAffordSwitch}
              className="tap-target flex-1 rounded-full bg-warmth-500 py-2 text-[13px] font-medium text-white disabled:opacity-40"
            >
              Switch now
            </button>
          </div>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.sender === "seeker" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[78%] rounded-xl2 px-3.5 py-2.5 text-[14px] leading-relaxed ${
                m.sender === "seeker"
                  ? "bg-warmth-500 text-white"
                  : "bg-linen-100 text-dusk-900"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-linen-200 bg-linen-50 px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-3">
        <div className="flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={ended}
            placeholder="Type how you're feeling…"
            className="flex-1 rounded-full border border-linen-200 bg-white px-4 py-3 text-[14px] text-dusk-900 outline-none focus:border-warmth-500 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={ended || !draft.trim()}
            className="tap-target flex h-11 w-11 items-center justify-center rounded-full bg-warmth-500 text-white disabled:opacity-40"
            aria-label="Send"
          >
            <PaperPlaneRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
