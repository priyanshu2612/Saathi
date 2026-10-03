"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppState } from "@/lib/store";
import { SessionMode, SessionRecord } from "@/lib/types";
import CallWaiting, { CallEndReason } from "@/components/session/CallWaiting";
import { useToast } from "@/components/ui/Toast";

const END_MESSAGES: Record<CallEndReason, string> = {
  declined: "The Saathi couldn't take your call right now.",
  missed: "The Saathi didn't pick up. Try again in a moment.",
  cancelled: "The call was cancelled.",
  ended: "The call has ended.",
};

export default function NewSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mentorId = searchParams.get("mentorId");
  const mode = (searchParams.get("mode") as SessionMode | null) ?? "chat";
  const { startSession, endSession, activateSession, dropSession, mentors } = useAppState();
  const started = useRef(false);
  const [ringing, setRinging] = useState<SessionRecord | null>(null);
  const { showNotice } = useToast();

  useEffect(() => {
    if (started.current || !mentorId) return;
    started.current = true;
    startSession(mentorId, mode).then((session) => {
      if (!session) {
        router.replace(`/mentor/${mentorId}?mode=${mode}`);
      } else if (session.status === "ringing") {
        setRinging(session);
      } else {
        router.replace(`/session/${session.id}`);
      }
    });
  }, [mentorId, mode, router, startSession]);

  const mentor = mentors.find((m) => m.id === mentorId);

  if (ringing && mentor) {
    return (
      <CallWaiting
        session={ringing}
        mentor={mentor}
        onAnswered={() => {
          activateSession(ringing.id);
          router.replace(`/session/${ringing.id}`);
        }}
        onEnded={(reason) => {
          dropSession(ringing.id);
          showNotice(END_MESSAGES[reason]);
          router.replace("/home");
        }}
        onCancel={async () => {
          await endSession(ringing.id, 0);
          dropSession(ringing.id);
          router.replace(`/mentor/${mentorId}?mode=${mode}`);
        }}
      />
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-[14px] text-dusk-400">Connecting you now…</p>
    </div>
  );
}
