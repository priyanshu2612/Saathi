"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PrimaryButton from "@/components/ui/PrimaryButton";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { PIN_LENGTH, useAppState } from "@/lib/store";

type Step = "enter" | "create" | "confirm";

export default function PinPage() {
  const router = useRouter();
  const { phoneNumber, authIntent, signUp, logIn } = useAppState();
  const [step, setStep] = useState<Step>(authIntent === "signup" ? "create" : "enter");
  const [firstPin, setFirstPin] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(PIN_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!phoneNumber || !authIntent) router.replace("/signin");
  }, [phoneNumber, authIntent, router]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, [step]);

  const resetBoxes = () => {
    setDigits(Array(PIN_LENGTH).fill(""));
    inputsRef.current[0]?.focus();
  };

  const handleChange = (i: number, value: string) => {
    const d = value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[i] = d;
      return next;
    });
    setError(null);
    if (d && i < PIN_LENGTH - 1) inputsRef.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
    }
  };

  const handleSubmit = async () => {
    const pin = digits.join("");
    if (step === "create") {
      setFirstPin(pin);
      setStep("confirm");
      resetBoxes();
      return;
    }
    if (step === "confirm" && pin !== firstPin) {
      setError("PINs don't match. Try again.");
      setStep("create");
      setFirstPin("");
      resetBoxes();
      return;
    }

    setSubmitting(true);
    const result = step === "confirm" ? await signUp(pin) : await logIn(pin);
    setSubmitting(false);
    if (result.ok) {
      router.push("/home");
    } else {
      setError(result.error);
      resetBoxes();
    }
  };

  const handleBack = () => {
    if (step === "confirm") {
      setStep("create");
      setFirstPin("");
      resetBoxes();
    } else {
      router.push("/signin");
    }
  };

  const formattedPhone = phoneNumber ? `+91 ${phoneNumber}` : "";
  const heading =
    step === "enter" ? "Welcome back" : step === "create" ? "Create your PIN" : "Confirm your PIN";
  const subheading =
    step === "enter"
      ? "Enter your 4-digit PIN to continue."
      : step === "create"
        ? "Choose a 4-digit PIN. You'll use it to sign in next time."
        : "Enter the same PIN once more.";
  const cta = step === "create" ? "Continue" : step === "confirm" ? "Create account" : "Sign in";

  return (
    <div className="flex min-h-screen flex-col">
      <ScreenHeader onBack={handleBack} />
      <div className="flex flex-1 flex-col px-6 pt-6">
        <h1 className="font-display text-[26px] leading-tight text-dusk-900">{heading}</h1>
        <p className="mt-1.5 text-[14px] text-dusk-400">
          {subheading}{" "}
          <span className="font-medium text-dusk-700">{formattedPhone}</span>
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
              type="password"
              inputMode="numeric"
              autoComplete={step === "enter" ? "current-password" : "new-password"}
              maxLength={1}
              aria-label={`PIN digit ${i + 1}`}
              className="h-16 w-14 rounded-xl2 border border-linen-200 bg-linen-100 text-center text-[24px] font-semibold text-dusk-900 outline-none focus:border-warmth-500"
            />
          ))}
        </div>
        {error && <p className="mt-3 text-center text-[13px] text-warmth-600">{error}</p>}
      </div>

      <div className="px-6 pb-[max(20px,env(safe-area-inset-bottom))] pt-3">
        <PrimaryButton onClick={handleSubmit} disabled={digits.some((d) => !d) || submitting}>
          {submitting ? "Please wait…" : cta}
        </PrimaryButton>
      </div>
    </div>
  );
}
