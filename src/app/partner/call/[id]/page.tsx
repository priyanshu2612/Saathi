"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Microphone,
  MicrophoneSlash,
  PhoneDisconnect,
  UserCircle,
  VideoCamera,
  VideoCameraSlash,
} from "@phosphor-icons/react";
import TrackView from "@/components/session/TrackView";
import DraggableSelfView from "@/components/session/DraggableSelfView";
import GiftAck from "@/components/session/GiftAck";
import { useAppState } from "@/lib/store";
import { getGift } from "@/lib/gifts";
import { useAgoraCall } from "@/lib/useAgoraCall";
import { CallPollSession, endSessionRemote, getMentorId, pollMentorCall } from "@/lib/data/backend";

// The Saathi's side of a live video call. Reached by accepting a ringing
// call on the partner dashboard.
export default function PartnerCallPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const mentorId = getMentorId();
  const { recordGiftReceived } = useAppState();
  const seenGifts = useRef<Set<string> | null>(null);
  const [receivedGift, setReceivedGift] = useState<{
    key: number;
    name: string;
    image: string;
    coins: number;
  } | null>(null);
  const agora = useAgoraCall({ userId: mentorId, sessionId: id, enabled: Boolean(mentorId) });

  const [info, setInfo] = useState<CallPollSession | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [ending, setEnding] = useState(false);
  const callOver = agora.remoteLeft || info?.status === "completed";

  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Topic (which the seeker may lock in after we pick up) and a fallback
  // "call ended" signal in case the Agora leave event is missed.
  useEffect(() => {
    if (!mentorId) return;
    let cancelled = false;
    const tick = () =>
      pollMentorCall(mentorId, id)
        .then((session) => {
          if (cancelled) return;
          setInfo(session);
          // Gifts sent from the seeker's side show up here. The first poll
          // only sets the baseline so a reload doesn't replay old gifts.
          const gifts = session.gifts ?? [];
          const isBaseline = seenGifts.current === null;
          if (isBaseline) seenGifts.current = new Set();
          for (const g of gifts) {
            if (seenGifts.current!.has(g.id)) continue;
            seenGifts.current!.add(g.id);
            recordGiftReceived({
              id: g.id,
              giftId: g.giftId,
              giftName: g.giftName,
              coins: g.mentorCoins,
              from: session.seekerName ?? "A seeker",
              createdAt: g.createdAt,
            });
            if (!isBaseline) {
              setReceivedGift({
                key: Date.now(),
                name: g.giftName,
                image: getGift(g.giftId)?.image ?? "/gifts/surprise-box.png",
                coins: g.mentorCoins,
              });
              setTimeout(() => setReceivedGift(null), 3200);
            }
          }
        })
        .catch(() => {});
    tick();
    const poll = setInterval(tick, 2000);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, [mentorId, id, recordGiftReceived]);

  useEffect(() => {
    if (!callOver) return;
    const t = setTimeout(() => router.replace("/partner/dashboard"), 2000);
    return () => clearTimeout(t);
  }, [callOver, router]);

  const handleEnd = async () => {
    setEnding(true);
    try {
      await endSessionRemote(id);
    } catch {
      /* the seeker's client also ends the session */
    }
    router.replace("/partner/dashboard");
  };

  if (!mentorId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <p className="text-dusk-700">Sign in as a Saathi to take calls.</p>
      </div>
    );
  }

  const minutes = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return (
    <div className="relative flex min-h-screen flex-col bg-black text-white">
      <div className="absolute inset-0">
        {agora.remoteVideo ? (
          <TrackView track={agora.remoteVideo} />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-dusk-900">
            <UserCircle size={96} weight="thin" className="text-white/40" />
            <p className="text-[13px] text-white/70">
              {agora.status === "error"
                ? "Couldn't connect the call."
                : agora.remoteJoined
                  ? "Their camera is off"
                  : "Waiting for them to connect…"}
            </p>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/70" />
      </div>

      <div className="relative px-5 pt-6">
        <p className="font-display text-[20px]">{info?.seekerName ?? "Seeker"}</p>
        <p className="text-[13px] text-white/70">
          {minutes}:{secs.toString().padStart(2, "0")}
        </p>
        {info?.topic && (
          <span className="mt-2 inline-block rounded-full bg-white/15 px-3 py-1 text-[12px] font-medium">
            Topic: {info.topic}
          </span>
        )}
      </div>

      {agora.error && (
        <div className="relative mx-5 mt-4 rounded-xl2 bg-white/10 p-3 text-center text-[12px] text-white/90">
          {agora.error}
        </div>
      )}
      {callOver && (
        <div className="relative mx-5 mt-4 rounded-xl2 bg-white/15 p-3 text-center text-[13px]">
          The seeker ended the call.
        </div>
      )}

      <DraggableSelfView>
        {agora.cameraOn && agora.localVideo ? (
          <TrackView track={agora.localVideo} />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <VideoCameraSlash size={20} className="text-white/60" />
          </div>
        )}
      </DraggableSelfView>

      {receivedGift && (
        <GiftAck
          key={receivedGift.key}
          gift={{ name: receivedGift.name, image: receivedGift.image }}
          title={`${info?.seekerName ?? "A seeker"} sent you ${receivedGift.name}!`}
          subtitle={`+${receivedGift.coins} coins added to your earnings`}
        />
      )}

      <div className="relative mt-auto flex items-center justify-center gap-5 px-5 pb-[max(28px,env(safe-area-inset-bottom))] pt-6">
        <button
          onClick={agora.toggleMic}
          className="tap-target flex h-14 w-14 items-center justify-center rounded-full bg-white/15"
          aria-label={agora.micOn ? "Mute microphone" : "Unmute microphone"}
        >
          {agora.micOn ? <Microphone size={22} /> : <MicrophoneSlash size={22} />}
        </button>
        <button
          onClick={handleEnd}
          disabled={ending}
          className="tap-target flex h-16 w-16 items-center justify-center rounded-full bg-warmth-500 disabled:opacity-60"
          aria-label="End call"
        >
          <PhoneDisconnect size={24} weight="fill" />
        </button>
        <button
          onClick={agora.toggleCamera}
          className="tap-target flex h-14 w-14 items-center justify-center rounded-full bg-white/15"
          aria-label={agora.cameraOn ? "Turn camera off" : "Turn camera on"}
        >
          {agora.cameraOn ? <VideoCamera size={22} /> : <VideoCameraSlash size={22} />}
        </button>
      </div>
    </div>
  );
}
