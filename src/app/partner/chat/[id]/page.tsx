"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CaretLeft, PaperPlaneRight } from "@phosphor-icons/react";
import { endSessionRemote, getMentorId } from "@/lib/data/backend";
import { useChatThread } from "@/lib/useChatThread";
import { useChatInbox } from "@/lib/useChatInbox";

// The Saathi's side of a seeker's chat. Reached from the dashboard's Chats
// list or the "new message" banner.
export default function PartnerChatPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const mentorId = getMentorId();
  const { messages, status, error, send } = useChatThread(mentorId, id);
  const inbox = useChatInbox(mentorId, true, 5000);
  const seekerName = inbox.find((c) => c.id === id)?.seekerName ?? "Seeker";
  const [draft, setDraft] = useState("");
  const [ending, setEnding] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const over = status !== "active";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  if (!mentorId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <p className="text-dusk-700">Sign in as a Saathi to chat.</p>
      </div>
    );
  }

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || over) return;
    setDraft("");
    if (!(await send(text))) setDraft(text);
  };

  const handleEnd = async () => {
    setEnding(true);
    try {
      await endSessionRemote(id);
    } catch {
      /* the seeker's side can also end it */
    }
    router.replace("/partner/dashboard");
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-linen-50">
      <div className="flex items-center justify-between border-b border-linen-200 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => router.replace("/partner/dashboard")}
            className="tap-target flex h-9 w-9 items-center justify-center rounded-full bg-linen-100 text-dusk-900"
            aria-label="Back"
          >
            <CaretLeft size={18} />
          </button>
          <div>
            <p className="text-[14px] font-semibold text-dusk-900">{seekerName}</p>
            <p className="text-[11px] text-dusk-400">{over ? "Chat ended" : "Chatting now · free"}</p>
          </div>
        </div>
        {!over && (
          <button
            onClick={handleEnd}
            disabled={ending}
            className="tap-target rounded-full bg-linen-100 px-4 py-1.5 text-[13px] font-medium text-dusk-700 disabled:opacity-50"
          >
            End chat
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="pt-10 text-center text-[13px] text-dusk-400">No messages yet. Say hello!</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[78%] rounded-xl2 px-3.5 py-2.5 text-[14px] leading-relaxed ${
                m.mine ? "bg-warmth-500 text-white" : "bg-linen-100 text-dusk-900"
              }`}
            >
              {m.body}
            </div>
          </div>
        ))}
        {over && <p className="pt-2 text-center text-[12px] text-dusk-400">This chat has ended.</p>}
      </div>

      <div className="border-t border-linen-200 bg-linen-50 px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-3">
        {error && <p className="mb-2 text-[12px] text-warmth-600">{error}</p>}
        <div className="flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={over}
            maxLength={500}
            placeholder="Type a message…"
            className="flex-1 rounded-full border border-linen-200 bg-white px-4 py-3 text-[14px] text-dusk-900 outline-none focus:border-warmth-500 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={over || !draft.trim()}
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
