"use client";

import { useEffect, useRef, useState } from "react";
import { ChatCircleDots, PaperPlaneRight, X } from "@phosphor-icons/react";
import { CallChatMessage, listCallChat, sendCallChat } from "@/lib/data/backend";

/**
 * Small floating chat window for a live call. Collapsed it's a round button
 * with an unread badge; open it's a compact panel above the call controls.
 */
export default function CallChat({
  userId,
  sessionId,
  enabled = true,
}: {
  userId: string | null;
  sessionId: string;
  enabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<CallChatMessage[]>([]);
  const [unread, setUnread] = useState(0);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const openRef = useRef(open);
  const lastAt = useRef<string | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    openRef.current = open;
    if (open) setUnread(0);
  }, [open]);

  const merge = (incoming: CallChatMessage[]) => {
    if (incoming.length === 0) return;
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      const fresh = incoming.filter((m) => !seen.has(m.id));
      if (fresh.length === 0) return prev;
      if (!openRef.current) {
        const theirs = fresh.filter((m) => !m.mine).length;
        if (theirs > 0) setUnread((n) => n + theirs);
      }
      return [...prev, ...fresh];
    });
    lastAt.current = incoming[incoming.length - 1].createdAt;
  };

  useEffect(() => {
    if (!enabled || !userId) return;
    let cancelled = false;
    const tick = () =>
      listCallChat(userId, sessionId, lastAt.current)
        .then((list) => {
          if (!cancelled) merge(list);
        })
        .catch(() => {});
    tick();
    const poll = setInterval(tick, 2000);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, userId, sessionId]);

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !userId) return;
    setDraft("");
    setError(null);
    try {
      merge([await sendCallChat(userId, sessionId, text)]);
    } catch (err) {
      setDraft(text);
      setError(err instanceof Error ? err.message : "Couldn't send.");
    }
  };

  if (!enabled || !userId) return null;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="tap-target absolute bottom-32 left-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur"
        aria-label="Open chat"
      >
        <ChatCircleDots size={22} weight="fill" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-warmth-500 px-1 text-[11px] font-semibold">
            {unread}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="absolute bottom-32 left-4 z-20 flex h-72 w-[min(78vw,300px)] flex-col overflow-hidden rounded-xl2 bg-black/70 text-white shadow-warm backdrop-blur">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[13px] font-semibold">Chat</span>
        <button onClick={() => setOpen(false)} className="tap-target" aria-label="Close chat">
          <X size={16} />
        </button>
      </div>
      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-3 pb-2">
        {messages.length === 0 && (
          <p className="pt-6 text-center text-[12px] text-white/60">No messages yet. Say hi!</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-[13px] leading-snug ${
                m.mine ? "bg-warmth-500" : "bg-white/20"
              }`}
            >
              {m.body}
            </div>
          </div>
        ))}
      </div>
      {error && <p className="px-3 pb-1 text-[11px] text-warmth-100">{error}</p>}
      <div className="flex items-center gap-2 border-t border-white/15 p-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          maxLength={500}
          placeholder="Type a message…"
          className="min-w-0 flex-1 rounded-full bg-white/15 px-3 py-2 text-[13px] text-white outline-none placeholder:text-white/50"
        />
        <button
          onClick={handleSend}
          disabled={!draft.trim()}
          className="tap-target flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warmth-500 disabled:opacity-40"
          aria-label="Send"
        >
          <PaperPlaneRight size={16} />
        </button>
      </div>
    </div>
  );
}
