"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IRemoteVideoTrack,
} from "agora-rtc-sdk-ng";
import { getAgoraCredentials } from "./data/backend";

export type AgoraStatus = "connecting" | "connected" | "error";

/**
 * Joins the Agora channel for a live video call and publishes the local
 * mic + camera. Both the seeker (CallSession) and the Saathi
 * (/partner/call/[id]) use it; the token endpoint decides which uid each
 * side gets. The SDK is imported lazily because it touches `window` and
 * can't be loaded during server rendering.
 */
export function useAgoraCall({
  userId,
  sessionId,
  enabled,
}: {
  userId: string | null;
  sessionId: string;
  enabled: boolean;
}) {
  const [status, setStatus] = useState<AgoraStatus>("connecting");
  const [error, setError] = useState<string | null>(null);
  const [remoteJoined, setRemoteJoined] = useState(false);
  const [remoteLeft, setRemoteLeft] = useState(false);
  const [remoteVideo, setRemoteVideo] = useState<IRemoteVideoTrack | null>(null);
  const [localVideo, setLocalVideo] = useState<ICameraVideoTrack | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const micRef = useRef<IMicrophoneAudioTrack | null>(null);
  const camRef = useRef<ICameraVideoTrack | null>(null);

  useEffect(() => {
    if (!enabled || !userId) return;
    let cancelled = false;

    const cleanup = async () => {
      micRef.current?.close();
      camRef.current?.close();
      micRef.current = null;
      camRef.current = null;
      const client = clientRef.current;
      clientRef.current = null;
      try {
        await client?.leave();
      } catch {
        /* already left */
      }
    };

    (async () => {
      try {
        const [{ default: AgoraRTC }, creds] = await Promise.all([
          import("agora-rtc-sdk-ng"),
          getAgoraCredentials(userId, sessionId),
        ]);
        if (cancelled) return;
        AgoraRTC.setLogLevel(3); // warnings and errors only

        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        clientRef.current = client;

        client.on("user-published", async (user, mediaType) => {
          await client.subscribe(user, mediaType);
          if (cancelled) return;
          setRemoteJoined(true);
          if (mediaType === "video") setRemoteVideo(user.videoTrack ?? null);
          if (mediaType === "audio") user.audioTrack?.play();
        });
        client.on("user-unpublished", (_user, mediaType) => {
          if (mediaType === "video") setRemoteVideo(null);
        });
        client.on("user-joined", () => setRemoteJoined(true));
        client.on("user-left", () => {
          setRemoteVideo(null);
          setRemoteLeft(true);
        });

        await client.join(creds.appId, creds.channel, creds.token, creds.uid);
        if (cancelled) return cleanup();

        // Camera and mic are requested separately so a blocked camera still
        // leaves an audio-only call instead of failing the whole join.
        const tracks: (IMicrophoneAudioTrack | ICameraVideoTrack)[] = [];
        const problems: string[] = [];
        try {
          const mic = await AgoraRTC.createMicrophoneAudioTrack();
          micRef.current = mic;
          tracks.push(mic);
        } catch {
          problems.push("microphone");
          setMicOn(false);
        }
        try {
          const cam = await AgoraRTC.createCameraVideoTrack();
          camRef.current = cam;
          tracks.push(cam);
          if (!cancelled) setLocalVideo(cam);
        } catch {
          problems.push("camera");
          setCameraOn(false);
        }
        if (cancelled) return cleanup();

        if (tracks.length > 0) await client.publish(tracks);
        if (problems.length > 0) {
          setError(
            `Couldn't access your ${problems.join(" and ")} — check browser permissions. You can still stay on the call.`
          );
        }
        setStatus("connected");
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setError(err instanceof Error ? err.message : "Couldn't connect the video call.");
        await cleanup();
      }
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [enabled, userId, sessionId]);

  const toggleMic = useCallback(async () => {
    const track = micRef.current;
    if (!track) return;
    const next = !track.enabled;
    await track.setEnabled(next);
    setMicOn(next);
  }, []);

  const toggleCamera = useCallback(async () => {
    const track = camRef.current;
    if (!track) return;
    const next = !track.enabled;
    await track.setEnabled(next);
    setCameraOn(next);
  }, []);

  return {
    status,
    error,
    remoteJoined,
    remoteLeft,
    remoteVideo,
    localVideo,
    micOn,
    cameraOn,
    toggleMic,
    toggleCamera,
  };
}
