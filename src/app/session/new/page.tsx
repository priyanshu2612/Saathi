"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppState } from "@/lib/store";
import { SessionMode } from "@/lib/types";

export default function NewSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mentorId = searchParams.get("mentorId");
  const mode = (searchParams.get("mode") as SessionMode | null) ?? "chat";
  const { startSession } = useAppState();
  const started = useRef(false);

  useEffect(() => {
    if (started.current || !mentorId) return;
    started.current = true;
    startSession(mentorId, mode).then((session) => {
      if (session) {
        router.replace(`/session/${session.id}`);
      } else {
        router.replace(`/mentor/${mentorId}?mode=${mode}`);
      }
    });
  }, [mentorId, mode, router, startSession]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-[14px] text-dusk-400">Connecting you now…</p>
    </div>
  );
}
