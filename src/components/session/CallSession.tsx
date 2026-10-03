"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Microphone,
  MicrophoneSlash,
  VideoCamera,
  VideoCameraSlash,
  PhoneDisconnect,
  SpeakerHigh,
  SpeakerSlash,
  Gift as GiftIcon,
} from "@phosphor-icons/react";
import { useSessionBilling } from "@/lib/useSessionBilling";
import { useAgoraCall } from "@/lib/useAgoraCall";
import { getSeekerId } from "@/lib/data/backend";
import { isDemoMode } from "@/lib/supabase/client";
import { Mentor, SessionRecord } from "@/lib/types";
import TrackView from "./TrackView";
import DraggableSelfView from "./DraggableSelfView";
import GiftSheet from "./GiftSheet";
import GiftAck from "./GiftAck";
import TopUpSheet from "./TopUpSheet";
import { useAppState } from "@/lib/store";
import { Gift } from "@/lib/gifts";

export default function CallSession({
  session,
  mentor,
}: {
  session: SessionRecord;
  mentor: Mentor;
}) {
  const router = useRouter();
  const { coinBalance, sendGift } = useAppState();
  const [giftOpen, setGiftOpen] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [sentGift, setSentGift] = useState<{ gift: Gift; key: number } | null>(null);
  const isVideo = session.mode === "video";
  const { elapsedSeconds, charged, ended, showLowBalance, endNow } = useSessionBilling(
    session,
    mentor
  );

  // Real video calls go through Agora; audio calls (and demo mode) keep the
  // simulated remote side below.
  const real = !isDemoMode && isVideo;
  const agora = useAgoraCall({ userId: getSeekerId(), sessionId: session.id, enabled: real });

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [demoMicOn, setMicOn] = useState(true);
  const [demoCameraOn, setCameraOn] = useState(isVideo);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [demoMediaError, setMediaError] = useState<string | null>(null);
  const micOn = real ? agora.micOn : demoMicOn;
  const cameraOn = real ? agora.cameraOn : demoCameraOn;
  const mediaError = real ? agora.error : demoMediaError;

  // The Saathi hanging up ends the call for the seeker too.
  useEffect(() => {
    if (real && agora.remoteLeft && !ended) {
      endNow();
      router.replace(`/session/${session.id}/rate`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [real, agora.remoteLeft]);

  useEffect(() => {
    if (real) return;
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ audio: true, video: isVideo })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      })
      .catch(() => {
        if (!cancelled) {
          setMediaError(
            isVideo
              ? "Camera/mic access was blocked — you can still stay on the call, but the mentor won't see or hear you."
              : "Mic access was blocked — you can still stay on the call, but the mentor won't hear you."
          );
        }
      });
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [isVideo, real]);

  const toggleMic = () => {
    if (real) {
      agora.toggleMic();
      return;
    }
    setMicOn((on) => {
      streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !on));
      return !on;
    });
  };

  const toggleCamera = () => {
    if (real) {
      agora.toggleCamera();
      return;
    }
    setCameraOn((on) => {
      streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = !on));
      return !on;
    });
  };

  const handleSendGift = async (gift: Gift) => {
    const result = await sendGift(session.id, mentor, gift);
    if (result.ok) {
      setGiftOpen(false);
      setSentGift({ gift, key: Date.now() });
      setTimeout(() => setSentGift(null), 3200);
    }
    return result;
  };

  const handleEnd = () => {
    endNow();
    router.push(`/session/${session.id}/rate`);
  };

  const minutes = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  const mentorVideo = mentor.videos[0];

  return (
    <div className="relative flex min-h-screen flex-col bg-black text-white">
      {/* Remote side: the Saathi's live Agora feed for real video calls;
          otherwise simulated with their intro clip / avatar. */}
      <div className="absolute inset-0">
        {real && agora.remoteVideo ? (
          <TrackView track={agora.remoteVideo} />
        ) : !real && isVideo && mentorVideo ? (
          <video
            src={mentorVideo}
            className="h-full w-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-dusk-900">
            <div className="relative h-32 w-32 overflow-hidden rounded-full ring-4 ring-white/10">
              <Image src={mentor.photoUrl} alt={mentor.name} fill className="object-cover" />
            </div>
            {real && (
              <p className="absolute bottom-40 text-[13px] text-white/70">
                {agora.status === "error"
                  ? "Couldn't connect the call."
                  : agora.remoteJoined
                    ? `${mentor.name}'s camera is off`
                    : `Waiting for ${mentor.name} to join…`}
              </p>
            )}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/70" />
      </div>

      <div className="relative flex items-center justify-between px-5 pt-6">
        <div>
          <p className="font-display text-[20px]">{mentor.name}</p>
          <p className="text-[13px] text-white/70">
            {minutes}:{secs.toString().padStart(2, "0")} · {charged} coins used
          </p>
        </div>
        <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium">
          {isVideo ? "Video call" : "Audio call"}
        </span>
      </div>

      {mediaError && (
        <div className="relative mx-5 mt-4 rounded-xl2 bg-white/10 p-3 text-center text-[12px] text-white/90">
          {mediaError}
        </div>
      )}

      {ended && (
        <div className="relative mx-5 mt-4 rounded-xl2 bg-white/15 p-3 text-center text-[13px]">
          Your balance ran out, so we ended the call here.
          <button
            onClick={() => router.push(`/session/${session.id}/rate`)}
            className="tap-target mt-2 block w-full rounded-full bg-warmth-500 py-2 text-[13px] font-medium text-white"
          >
            Rate this conversation
          </button>
        </div>
      )}

      {showLowBalance && !ended && (
        <div className="relative mx-5 mt-4 flex items-center justify-between rounded-xl2 bg-white/15 p-3">
          <span className="text-[13px]">
            Running low — about {Math.max(1, Math.floor(coinBalance / session.ratePerMinute))} min left
          </span>
          <button
            onClick={() => setTopUpOpen(true)}
            className="tap-target rounded-full bg-warmth-500 px-3 py-1.5 text-[12px] font-medium text-white"
          >
            Top up
          </button>
        </div>
      )}

      {/* Self view */}
      {isVideo && (
        <DraggableSelfView>
          {cameraOn && real ? (
            <TrackView track={agora.localVideo} />
          ) : cameraOn ? (
            <video ref={localVideoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <VideoCameraSlash size={20} className="text-white/60" />
            </div>
          )}
        </DraggableSelfView>
      )}

      {sentGift && (
        <GiftAck
          key={sentGift.key}
          gift={sentGift.gift}
          title={`${sentGift.gift.name} sent!`}
          subtitle={`${mentor.name} received your gift`}
        />
      )}

      <GiftSheet
        open={giftOpen}
        onClose={() => setGiftOpen(false)}
        mentorName={mentor.name}
        coinBalance={coinBalance}
        onSend={handleSendGift}
        onNeedTopUp={() => {
          setGiftOpen(false);
          setTopUpOpen(true);
        }}
      />
      <TopUpSheet
        open={topUpOpen}
        onClose={() => setTopUpOpen(false)}
        reason={showLowBalance ? "Your balance is running low — top up to keep talking." : undefined}
      />

      <div className="relative mt-auto flex items-center justify-center gap-3 px-5 pb-[max(28px,env(safe-area-inset-bottom))] pt-6">
        <button
          onClick={toggleMic}
          className="tap-target flex h-12 w-12 items-center justify-center rounded-full bg-white/15"
          aria-label={micOn ? "Mute microphone" : "Unmute microphone"}
        >
          {micOn ? <Microphone size={22} /> : <MicrophoneSlash size={22} />}
        </button>

        {isVideo && (
          <button
            onClick={toggleCamera}
            className="tap-target flex h-12 w-12 items-center justify-center rounded-full bg-white/15"
            aria-label={cameraOn ? "Turn camera off" : "Turn camera on"}
          >
            {cameraOn ? <VideoCamera size={22} /> : <VideoCameraSlash size={22} />}
          </button>
        )}

        <button
          onClick={handleEnd}
          className="tap-target flex h-16 w-16 items-center justify-center rounded-full bg-warmth-500"
          aria-label="End call"
        >
          <PhoneDisconnect size={24} weight="fill" />
        </button>

        <button
          onClick={() => setSpeakerOn((s) => !s)}
          className="tap-target flex h-12 w-12 items-center justify-center rounded-full bg-white/15"
          aria-label={speakerOn ? "Turn speaker off" : "Turn speaker on"}
        >
          {speakerOn ? <SpeakerHigh size={22} /> : <SpeakerSlash size={22} />}
        </button>

        <button
          onClick={() => setGiftOpen(true)}
          className="tap-target flex h-12 w-12 items-center justify-center rounded-full bg-white/15"
          aria-label="Send a gift"
        >
          <GiftIcon size={22} weight="fill" />
        </button>
      </div>
    </div>
  );
}
