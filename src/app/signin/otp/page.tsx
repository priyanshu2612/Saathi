"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PrimaryButton from "@/components/ui/PrimaryButton";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { useAppState } from "@/lib/store";

const OTP_LENGTH = 4;

export default function OtpPage() {
  const router = useRouter();
  const { phoneNumber, verifyOtp, requestOtp } = useAppState();
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!phoneNumber) router.replace("/signin");
  }, [phoneNumber, router]);

  const handleChange = (i: number, value: string) => {
    const d = value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[i] = d;
      return next;
    });
    setError(null);
    if (d && i < OTP_LENGTH - 1) inputsRef.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const code = digits.join("");
    if (verifyOtp(code)) {
      router.push("/home");
    } else {
      setError("Enter the 4-digit code to continue.");
    }
  };

  const formattedPhone = phoneNumber ? `+91 ${phoneNumber}` : "";

  return (
    <div className="flex min-h-screen flex-col">
      <ScreenHeader onBack={() => router.push("/signin")} />
      <div className="flex flex-1 flex-col px-6 pt-6">
        <h1 className="font-display text-[26px] leading-tight text-dusk-900">
          Enter the code we sent you
        </h1>
        <p className="mt-1.5 text-[14px] text-dusk-400">
          We texted a 4-digit code to <span className="font-medium text-dusk-700">{formattedPhone}</span>
        </p>

        <div className="mt-8 flex justify-center gap-3">
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
              maxLength={1}
              className="h-16 w-14 rounded-xl2 border border-linen-200 bg-linen-100 text-center text-[24px] font-semibold text-dusk-900 outline-none focus:border-warmth-500"
            />
          ))}
        </div>
        {error && <p className="mt-3 text-center text-[13px] text-warmth-600">{error}</p>}

        <button
          onClick={() => requestOtp(phoneNumber)}
          className="tap-target mt-6 text-center text-[13px] font-medium text-dusk-700 underline"
        >
          Resend code
        </button>
      </div>

      <div className="px-6 pb-[max(20px,env(safe-area-inset-bottom))] pt-3">
        <PrimaryButton onClick={handleVerify} disabled={digits.some((d) => !d)}>
          Verify &amp; continue
        </PrimaryButton>
      </div>
    </div>
  );
}
