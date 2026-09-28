"use client";

import { CaretLeft } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

interface Props {
  title?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  transparent?: boolean;
}

export default function ScreenHeader({ title, onBack, right, transparent }: Props) {
  const router = useRouter();
  return (
    <div
      className={`flex items-center justify-between px-5 py-4 ${
        transparent ? "" : "bg-linen-50"
      }`}
    >
      <button
        type="button"
        onClick={onBack ?? (() => router.back())}
        className="tap-target flex h-9 w-9 items-center justify-center rounded-full bg-linen-100 text-dusk-900"
        aria-label="Back"
      >
        <CaretLeft size={18} />
      </button>
      {title && (
        <h1 className="text-[16px] font-semibold text-dusk-900">{title}</h1>
      )}
      <div className="min-w-9">{right}</div>
    </div>
  );
}
