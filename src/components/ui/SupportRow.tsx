"use client";

import { WhatsappLogo } from "@phosphor-icons/react";
import { BUSINESS } from "@/lib/business";

/** WhatsApp-only support line shown on profile pages. */
export default function SupportRow() {
  const number = BUSINESS.supportWhatsapp;
  return (
    <a
      href={`https://wa.me/91${number}`}
      target="_blank"
      rel="noopener noreferrer"
      className="tap-target flex items-center gap-3 rounded-xl3 border border-linen-200/60 bg-card p-3.5"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-400/15 text-sage-500">
        <WhatsappLogo size={22} weight="fill" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold text-dusk-900">Support: {number}</span>
        <span className="block text-[12px] text-dusk-400">WhatsApp only · tap to message</span>
      </span>
    </a>
  );
}
