"use client";

import { X } from "@phosphor-icons/react";

/**
 * Bottom sheet over a dimmed backdrop, kept inside the 430px app column.
 * Tapping the dimmed area or the X closes it.
 */
export default function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-y-0 left-1/2 z-[80] flex w-full max-w-[430px] -translate-x-1/2 flex-col text-dusk-900">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="flex-1 cursor-default bg-black/50"
      />
      <div className="relative max-h-[85vh] overflow-y-auto rounded-t-[24px] bg-card px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-5 shadow-float">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[18px]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="tap-target flex h-8 w-8 items-center justify-center rounded-full bg-linen-100 text-dusk-700"
          >
            <X size={16} weight="bold" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
