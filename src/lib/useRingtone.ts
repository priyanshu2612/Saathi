"use client";

import { useEffect } from "react";

let sharedCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!sharedCtx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    sharedCtx = new Ctor();
  }
  return sharedCtx;
}

/**
 * Browsers only allow sound after a user gesture. Call this from a tap
 * handler (e.g. going online) so the ringtone can play later when a call
 * arrives. Also asks once for notification permission.
 */
export function primeRingtone() {
  const ctx = getCtx();
  if (ctx?.state === "suspended") ctx.resume().catch(() => {});
  if (typeof Notification !== "undefined" && Notification.permission === "default") {
    Notification.requestPermission().catch(() => {});
  }
}

function playRing(ctx: AudioContext) {
  // Classic double-burst ring: two 0.4s two-tone bursts, then silence.
  const now = ctx.currentTime;
  for (const offset of [0, 0.6]) {
    for (const freq of [440, 480]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.connect(gain).connect(ctx.destination);
      gain.gain.setValueAtTime(0, now + offset);
      gain.gain.linearRampToValueAtTime(0.25, now + offset + 0.03);
      gain.gain.setValueAtTime(0.25, now + offset + 0.37);
      gain.gain.linearRampToValueAtTime(0, now + offset + 0.4);
      osc.start(now + offset);
      osc.stop(now + offset + 0.42);
    }
  }
}

/** Rings (sound + vibration + flashing tab title + notification) while `active`. */
export function useRingtone(active: boolean, label = "Incoming call") {
  useEffect(() => {
    if (!active) return;
    const originalTitle = document.title;
    let flash = false;

    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "granted" &&
      document.hidden
    ) {
      try {
        new Notification("Sukoon", { body: label, tag: "sukoon-incoming-call" });
      } catch {
        /* some mobile browsers only allow notifications via a service worker */
      }
    }

    const ring = () => {
      const ctx = getCtx();
      if (ctx && ctx.state === "running") playRing(ctx);
      else ctx?.resume().catch(() => {});
      navigator.vibrate?.([400, 200, 400]);
      flash = !flash;
      document.title = flash ? `📞 ${label}` : originalTitle;
    };
    ring();
    const timer = setInterval(ring, 2000);
    return () => {
      clearInterval(timer);
      document.title = originalTitle;
      navigator.vibrate?.(0);
    };
  }, [active, label]);
}
