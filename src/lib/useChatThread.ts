"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CallChatMessage, pollCallChat, sendCallChat } from "@/lib/data/backend";

/** Live two-way chat for a session: polls for new messages and sends yours. */
export function useChatThread(userId: string | null, sessionId: string, enabled = true) {
  const [messages, setMessages] = useState<CallChatMessage[]>([]);
  const [status, setStatus] = useState<string>("active");
  const [error, setError] = useState<string | null>(null);
  const lastAt = useRef<string | undefined>(undefined);

  const merge = useCallback((incoming: CallChatMessage[]) => {
    if (incoming.length === 0) return;
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      const fresh = incoming.filter((m) => !seen.has(m.id));
      return fresh.length ? [...prev, ...fresh] : prev;
    });
    lastAt.current = incoming[incoming.length - 1].createdAt;
  }, []);

  useEffect(() => {
    if (!enabled || !userId) return;
    let cancelled = false;
    const tick = () =>
      pollCallChat(userId, sessionId, lastAt.current)
        .then((res) => {
          if (cancelled) return;
          setStatus(res.status);
          merge(res.messages);
        })
        .catch(() => {});
    tick();
    const poll = setInterval(tick, 1500);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, [enabled, userId, sessionId, merge]);

  const send = useCallback(
    async (text: string) => {
      if (!userId) return false;
      setError(null);
      try {
        merge([await sendCallChat(userId, sessionId, text)]);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't send.");
        return false;
      }
    },
    [userId, sessionId, merge]
  );

  return { messages, status, error, send };
}
