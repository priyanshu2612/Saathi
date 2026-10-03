"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Logo from "@/components/ui/Logo";
import BannerCarousel from "@/components/auth/BannerCarousel";
import { useAppState } from "@/lib/store";

export default function SignInPage() {
  const router = useRouter();
  const { checkPhone } = useAppState();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setLoading(true);
    const result = await checkPhone(phone);
    setLoading(false);
    if (result.ok) {
      router.push("/signin/pin");
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="flex min-h-screen flex-col px-6 pt-16 pb-8">
      <Logo className="h-9 w-auto" />
      <p className="mt-1 text-[14px] text-dusk-400">Talk to a trained, verified listener.</p>

      <div className="mt-8">
        <BannerCarousel />
      </div>

      <div className="mt-10">
        <label className="mb-2 block text-[13px] font-medium text-dusk-700">Phone number</label>
        <div className="flex items-center overflow-hidden rounded-xl2 border border-linen-200 bg-linen-100 focus-within:border-warmth-500">
          <span className="border-r border-linen-200 px-4 py-3.5 text-[15px] text-dusk-700">+91</span>
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
        {error && <p className="mt-2 text-[13px] text-warmth-600">{error}</p>}
      </div>

      <div className="mt-auto pt-10">
        <PrimaryButton onClick={handleContinue} disabled={phone.length < 10 || loading}>
          {loading ? "Checking…" : "Continue"}
        </PrimaryButton>
        <p className="mt-4 text-center text-[12px] text-dusk-400">
          Just your phone number and a 4-digit PIN — no SMS code needed.
        </p>
      </div>
    </div>
  );
}
