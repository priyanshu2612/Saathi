"use client";

import { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "quiet";
  fullWidth?: boolean;
}

export default function PrimaryButton({
  variant = "primary",
  fullWidth = true,
  className = "",
  children,
  ...rest
}: Props) {
  const base =
    "tap-target inline-flex items-center justify-center gap-2 rounded-[12px] px-5 py-3.5 text-[15px] font-medium transition active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100";
  const variants: Record<string, string> = {
    primary: "bg-warmth-500 text-white shadow-warm-sm hover:bg-warmth-600",
    secondary: "bg-dusk-900 text-linen-50 hover:bg-dusk-800",
    quiet: "bg-linen-100 text-dusk-900 hover:bg-linen-200",
  };
  return (
    <button
      className={`${base} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
