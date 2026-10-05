"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PrimaryButton from "@/components/ui/PrimaryButton";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { useAppState } from "@/lib/store";
import { sendPhoneOtp, verifyPhoneOtp } from "@/lib/data/backend";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

export default function OtpPage() {
  const router = useRouter();
  const { phoneNumber, authIntent } = useAppState();
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const sentRef = useRef(false);

  useEffect(() => {
    if (!phoneNumber || authIntent !== "signup") router.replace("/signin");
  }, [phoneNumber, authIntent, router]);

  const send = async () => {
    setError(null);
    setInfo(null);
    try {
      await sendPhoneOtp(phoneNumber);
      setInfo("Code sent. It's valid for 10 minutes.");
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send the code.");
    }
  };

  // Send once on arrival (the ref also guards React StrictMode's double effect).
  useEffect(() => {
    if (!phoneNumber || authIntent !== "signup" || sentRef.current) return;
    sentRef.current = true;
    send();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneNumber, authIntent]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const resetBoxes = () => {
    setDigits(Array(OTP_LENGTH).fill(""));
    inputsRef.current[0]?.focus();
  };

  const handleChange = (i: number, value: string) => {
    const pasted = value.replace(/\D/g, "");
    if (pasted.length > 1) {
      // Pasting (or SMS autofill) the whole code.
      setDigits(Array.from({ length: OTP_LENGTH }, (_, idx) => pasted[idx] ?? ""));
      inputsRef.current[Math.min(pasted.length, OTP_LENGTH) - 1]?.focus();
      setError(null);
      return;
    }
    setDigits((prev) => {
      const next = [...prev];
      next[i] = pasted;
      return next;
    });
    setError(null);
    if (pasted && i < OTP_LENGTH - 1) inputsRef.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputsRef.current[i - 1]?.focus();
  };

  const handleVerify = async () => {
    setVerifying(true);
    setError(null);
    try {
      await verifyPhoneOtp(phoneNumber, digits.join(""));
      router.push("/signin/pin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't verify the code.");
      resetBoxes();
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <ScreenHeader onBack={() => router.push("/signin")} />
      <div className="flex flex-1 flex-col px-6 pt-6">
        <h1 className="font-display text-[26px] leading-tight text-dusk-900">Verify your number</h1>
        <p className="mt-1.5 text-[14px] text-dusk-400">
          Enter the 6-digit code we sent to{" "}
          <span className="font-medium text-dusk-700">+91 {phoneNumber}</span>
        </p>

        <div className="mt-8 flex justify-center gap-2">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputsRef.current[i] = el;
              }}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              aria-label={`Code digit ${i + 1}`}
              className="h-14 w-11 rounded-xl2 border border-linen-200 bg-linen-100 text-center text-[22px] font-semibold text-dusk-900 outline-none focus:border-warmth-500"
            />
          ))}
        </div>

        {error && <p className="mt-3 text-center text-[13px] text-warmth-600">{error}</p>}
        {!error && info && <p className="mt-3 text-center text-[13px] text-sage-500">{info}</p>}

        <div className="mt-6 text-center text-[13px] text-dusk-400">
          {cooldown > 0 ? (
            <>Resend code in {cooldown}s</>
          ) : (
            <button type="button" onClick={send} className="tap-target font-medium text-dusk-700 underline">
              Resend code
            </button>
          )}
        </div>
      </div>

      <div className="px-6 pb-[max(20px,env(safe-area-inset-bottom))] pt-3">
        <PrimaryButton onClick={handleVerify} disabled={digits.some((d) => !d) || verifying}>
          {verifying ? "Verifying…" : "Verify"}
        </PrimaryButton>
      </div>
    </div>
  );
}
