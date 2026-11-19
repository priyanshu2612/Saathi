"use client";

import { useEffect, useState } from "react";
import { ChatInboxItem, getChatInbox } from "@/lib/data/backend";

/** A Saathi's live chats, refreshed every few seconds while `enabled`. */
export function useChatInbox(userId: string | null, enabled: boolean, everyMs = 3000) {
  const [chats, setChats] = useState<ChatInboxItem[]>([]);
  useEffect(() => {
    if (!enabled || !userId) {
      setChats([]);
      return;
    }
    let cancelled = false;
    const tick = () =>
      getChatInbox(userId)
        .then((list) => {
          if (!cancelled) setChats(list);
        })
        .catch(() => {});
    tick();
    const t = setInterval(tick, everyMs);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [userId, enabled, everyMs]);
  return chats;
}
