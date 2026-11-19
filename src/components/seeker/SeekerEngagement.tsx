"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Phone, PhoneDisconnect, Timer } from "@phosphor-icons/react";
import { useAppState } from "@/lib/store";
import { Mentor } from "@/lib/types";
import { markWelcomeCallDone, readWelcomeCall } from "@/lib/welcomeCall";
import { formatCountdown, useRechargeOffer } from "@/lib/useRechargeOffer";

// Seeker screens where nudges may appear. Calls, chats, sign-in and all the
// Saathi/admin areas are left alone.
const NUDGE_PREFIXES = ["/home", "/saved", "/history", "/profile", "/wallet", "/mentor", "/onboarding"];
const FAB_PREFIXES = ["/home", "/saved", "/history", "/profile", "/mentor"];

const WELCOME_DELAY_MS = 5000;
const RING_TIMEOUT_MS = 45_000;
const GIVE_UP_AFTER_MS = 60_000;

const matches = (path: string, prefixes: string[]) => prefixes.some((p) => path.startsWith(p));

/** Floating nudges for seekers: the welcome call and the 5-minute recharge timer. */
export default function SeekerEngagement() {
  const { isAuthenticated, hydrated } = useAppState();
  const pathname = usePathname() ?? "/";
  if (!hydrated || !isAuthenticated) return null;
  return (
    <>
      <WelcomeCall pathname={pathname} />
      {matches(pathname, FAB_PREFIXES) && <RechargeFab pathname={pathname} />}
    </>
  );
}

/* ───────────── welcome call ───────────── */

type Stage = "idle" | "call" | "message";

function WelcomeCall({ pathname }: { pathname: string }) {
  const router = useRouter();
  const { mentors } = useAppState();
  const [stage, setStage] = useState<Stage>("idle");
  const [saathi, setSaathi] = useState<Mentor | null>(null);

  // Latest values for the timers below, without restarting them.
  const mentorsRef = useRef(mentors);
  mentorsRef.current = mentors;
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  useEffect(() => {
    const rec = readWelcomeCall();
    if (!rec || rec.state !== "pending") return;

    const started = Date.now();
    let poll: ReturnType<typeof setInterval> | undefined;
    const tryShow = () => {
      if (Date.now() - rec.at > GIVE_UP_AFTER_MS + WELCOME_DELAY_MS && Date.now() - started > GIVE_UP_AFTER_MS) {
        markWelcomeCallDone();
        if (poll) clearInterval(poll);
        return;
      }
      if (!matches(pathRef.current, NUDGE_PREFIXES)) return;
      const online = mentorsRef.current.filter((m) => m.isOnline);
      if (online.length === 0) return;
      if (poll) clearInterval(poll);
      setSaathi(online[Math.floor(Math.random() * online.length)]);
      setStage("call");
    };

    const delay = Math.max(0, rec.at + WELCOME_DELAY_MS - Date.now());
    const first = setTimeout(() => {
      tryShow();
      poll = setInterval(tryShow, 2000);
    }, delay);
    return () => {
      clearTimeout(first);
      if (poll) clearInterval(poll);
    };
  }, []);

  const finish = useCallback(() => {
    markWelcomeCallDone();
    setStage("idle");
  }, []);

  const accept = () => {
    finish();
    if (saathi) router.push(`/session/new?mentorId=${saathi.id}&mode=video`);
  };

  const reject = useCallback(() => {
    markWelcomeCallDone();
    setStage("message");
  }, []);

  // An unanswered call counts as dismissed.
  useEffect(() => {
    if (stage !== "call") return;
    const t = setTimeout(reject, RING_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [stage, reject]);

  if (!saathi || stage === "idle") return null;

  if (stage === "call") {
    return (
      <Overlay dim>
        <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-dusk-900/95 to-black/95 px-8 text-center">
          <p className="text-[13px] font-medium uppercase tracking-widest text-white/60">Incoming call</p>
          <div className="relative mt-8">
            <span className="absolute inset-0 animate-ping rounded-full bg-sage-400/30" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={saathi.photoUrl}
              alt={saathi.name}
              className="relative h-40 w-40 rounded-full object-cover ring-4 ring-white/20"
            />
          </div>
          <h2 className="mt-6 font-display text-[28px] text-white">{saathi.name}</h2>
          <div className="mt-16 flex items-center gap-16">
            <button onClick={reject} aria-label="Decline call" className="flex flex-col items-center gap-2">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-float">
                <PhoneDisconnect size={28} weight="fill" />
              </span>
              <span className="text-[13px] text-white/80">Decline</span>
            </button>
            <button onClick={accept} aria-label="Accept call" className="flex flex-col items-center gap-2">
              <span className="flex h-16 w-16 animate-pulseGlow items-center justify-center rounded-full bg-sage-500 text-white shadow-float">
                <Phone size={28} weight="fill" />
              </span>
              <span className="text-[13px] text-white/80">Accept</span>
            </button>
          </div>
        </div>
      </Overlay>
    );
  }

  return (
    <Overlay dim={false}>
      <button aria-label="Close" onClick={finish} className="flex-1 cursor-default bg-black/40" />
      <div className="rounded-t-[24px] bg-card px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-5 shadow-float">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={saathi.photoUrl} alt={saathi.name} className="h-12 w-12 rounded-full object-cover" />
          <div>
            <p className="text-[15px] font-semibold text-dusk-900">{saathi.name}</p>
            <p className="text-[12px] text-sage-500">Message</p>
          </div>
        </div>
        <p className="mt-3 rounded-2xl rounded-tl-sm bg-linen-100 px-4 py-3 text-[14.5px] leading-relaxed text-dusk-900">
          Hey, I&apos;m waiting for you to increase your confidence in talking in real scenarios.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            onClick={finish}
            className="tap-target flex-1 rounded-full bg-linen-100 py-3 text-[14px] font-medium text-dusk-700"
          >
            Maybe later
          </button>
          <button
            onClick={() => {
              finish();
              router.push(`/session/new?mentorId=${saathi.id}&mode=chat`);
            }}
            className="tap-target flex-1 rounded-full bg-warmth-500 py-3 text-[14px] font-medium text-white"
          >
            Chat now · free
          </button>
        </div>
      </div>
    </Overlay>
  );
}

function Overlay({ children }: { children: React.ReactNode; dim?: boolean }) {
  return (
    <div className="fixed inset-y-0 left-1/2 z-[90] flex w-full max-w-[430px] -translate-x-1/2 flex-col">
      {children}
    </div>
  );
}

/* ───────────── 5-minute recharge button ───────────── */

function RechargeFab({ pathname }: { pathname: string }) {
  const router = useRouter();
  const { active, secondsLeft, bonusCoins, refresh } = useRechargeOffer();

  // After paying on the wallet page the offer is used up; re-check whenever
  // the seeker moves between screens.
  useEffect(() => {
    refresh();
  }, [pathname, refresh]);

  if (!active) return null;
  return (
    <div className="pointer-events-none fixed bottom-24 left-1/2 z-[60] flex w-full max-w-[430px] -translate-x-1/2 justify-end px-4">
      <button
        onClick={() => router.push("/wallet")}
        aria-label={`Recharge now to get ${bonusCoins} extra coins`}
        className="pointer-events-auto flex animate-pulseGlow items-center gap-2.5 rounded-full bg-gradient-to-br from-warmth-400 to-warmth-700 py-2 pl-3 pr-4 text-left text-white shadow-float"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
          <Timer size={20} weight="fill" />
        </span>
        <span className="leading-tight">
          <span className="block text-[15px] font-bold tabular-nums">{formatCountdown(secondsLeft)}</span>
          <span className="block text-[11px] text-white/90">Recharge · +{bonusCoins} coins</span>
        </span>
      </button>
    </div>
  );
}
