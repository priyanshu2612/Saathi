"use client";

import { usePathname } from "next/navigation";
import { WarningOctagon } from "@phosphor-icons/react";
import { SAATHI_APP_DOWN } from "@/lib/business";

/**
 * Full-screen, non-dismissable notice that replaces every Saathi screen while
 * the app is down. Flip SAATHI_APP_DOWN in lib/business.ts to bring it back.
 */
export default function SaathiDowntime() {
  const pathname = usePathname();
  if (!SAATHI_APP_DOWN || !pathname?.startsWith("/partner")) return null;

  return (
    <div
      role="alert"
      className="fixed inset-y-0 left-1/2 z-[100] flex w-full max-w-[430px] -translate-x-1/2 flex-col items-center justify-center bg-[#B91C1C] px-7 text-center text-white"
    >
      <WarningOctagon size={64} weight="fill" />
      <h1 className="mt-5 text-[22px] font-semibold leading-tight">The app is currently down</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-white/95">
        The app is down for a technical issue. We will message you personally when we are up and running.
        You can close the app.
      </p>
      <div className="my-6 h-px w-16 bg-white/40" />
      <h2 className="text-[22px] font-semibold leading-tight">ऐप अभी बंद है</h2>
      <p className="mt-3 text-[15px] leading-relaxed text-white/95">
        किसी तकनीकी समस्या के कारण ऐप अभी बंद है। जब हम फिर से चालू हो जाएँगे, तो हम आपको व्यक्तिगत रूप से मैसेज करेंगे।
        आप ऐप बंद कर सकते हैं।
      </p>
    </div>
  );
}
