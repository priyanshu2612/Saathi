"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HandHeart, ShieldCheck, Wallet } from "@phosphor-icons/react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { useAppState } from "@/lib/store";

const POINTS = [
  {
    icon: Wallet,
    title: "Fair, transparent pay",
    body: "See exactly what you earn per minute. No hidden cuts, and your rate grows with your ratings.",
  },
  {
    icon: ShieldCheck,
    title: "A safer, screened space",
    body: "Every Seeker is verified. One-tap report and block, and you can end any chat, anytime.",
  },
  {
    icon: HandHeart,
    title: "You're in control",
    body: "Go online when you want. A few hours a week, or a lot more — it's up to you.",
  },
];

export default function SaathiSignInPage() {
  const router = useRouter();
  const { claimMentorInvite } = useAppState();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canContinue = phone.length === 10 && code.trim().length >= 4 && !loading;

  const handleContinue = async () => {
    if (!canContinue) return;
    setLoading(true);
    setError(null);
    const result = await claimMentorInvite(code, phone);
    setLoading(false);
    if (!result.ok) {
      setError(
        result.error ??
          "That code doesn't look right — check it and try again, or apply below."
      );
      return;
    }
    router.push("/partner/profile?onboarding=1");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <ScreenHeader onBack={() => router.push("/welcome")} />
      <div className="flex-1 px-6 pb-8">
        <h1 className="font-display text-[26px] leading-tight text-dusk-900">
          Become a Saathi
        </h1>
        <p className="mt-2 text-[14px] text-dusk-400">
          Sukoon is a place where people come for a calm, caring conversation — and Saathis are
          the heart of it.
        </p>

        <div className="mt-6 space-y-3">
          {POINTS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-3 rounded-xl2 bg-linen-100 p-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warmth-50">
                <Icon size={18} className="text-warmth-500" />
              </div>
              <div>
                <p className="text-[13.5px] font-semibold text-dusk-900">{title}</p>
                <p className="mt-0.5 text-[12.5px] text-dusk-400">{body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <p className="text-[15px] font-semibold text-dusk-900">Already have an access code?</p>
          <p className="mt-1 text-[13px] text-dusk-400">
            Enter the phone number and code we sent you to pick up right where your application
            left off.
          </p>

          <div className="mt-4">
            <label className="mb-1.5 block text-[13px] font-medium text-dusk-700">
              Phone number
            </label>
            <div className="flex items-center overflow-hidden rounded-xl2 border border-linen-200 bg-linen-100 focus-within:border-warmth-500">
              <span className="border-r border-linen-200 px-4 py-3.5 text-[15px] text-dusk-700">
                +91
              </span>
              <input
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                  setError(null);
                }}
                inputMode="numeric"
                placeholder="98765 43210"
                className="flex-1 bg-transparent px-4 py-3.5 text-[15px] text-dusk-900 outline-none"
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="mb-1.5 block text-[13px] font-medium text-dusk-700">
              Access code
            </label>
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError(null);
              }}
              placeholder="e.g. SAATHI-2847"
              className="w-full rounded-xl2 border border-linen-200 bg-linen-100 px-4 py-3.5 text-center text-[16px] font-medium tracking-wide text-dusk-900 outline-none focus:border-warmth-500"
            />
          </div>
          {error && <p className="mt-2 text-[13px] text-warmth-600">{error}</p>}

          <div className="mt-4">
            <PrimaryButton onClick={handleContinue} disabled={!canContinue}>
              {loading ? "Checking…" : "Continue"}
            </PrimaryButton>
          </div>
        </div>

        <div className="mt-8 border-t border-linen-200 pt-6 text-center">
          <p className="text-[13px] text-dusk-400">New here?</p>
          <button
            type="button"
            onClick={() => router.push("/saathi/apply")}
            className="tap-target mt-1 text-[14px] font-semibold text-warmth-600 underline"
          >
            Apply to become a Saathi
          </button>
          <p className="mt-1 text-[12px] text-dusk-400">Takes about 5 minutes. Joining is free.</p>
        </div>
      </div>
    </div>
  );
}
