"use client";

import { useParams } from "next/navigation";
import { useAppState } from "@/lib/store";
import ChatSession from "@/components/session/ChatSession";
import CallSession from "@/components/session/CallSession";

export default function LiveSessionPage() {
  const { id } = useParams<{ id: string }>();
  const { sessions, mentors } = useAppState();

  const session = sessions.find((s) => s.id === id);
  const mentor = mentors.find((m) => m.id === session?.mentorId);

  if (!session || !mentor) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <p className="text-dusk-700">This conversation has ended.</p>
      </div>
    );
  }

  if (session.mode === "chat") {
    return <ChatSession session={session} mentor={mentor} />;
  }
  return <CallSession session={session} mentor={mentor} />;
}
