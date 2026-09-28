"use client";

interface Props {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  size?: "sm" | "lg";
}

export default function Chip({ label, selected, onClick, size = "sm" }: Props) {
  const padding = size === "lg" ? "px-5 py-3 text-[15px]" : "px-3.5 py-2 text-[13px]";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`tap-target rounded-full border font-medium transition active:scale-[0.97] ${padding} ${
        selected
          ? "border-warmth-500 bg-warmth-500 text-white"
          : "border-linen-200 bg-linen-100 text-dusk-800 hover:border-clay-300"
      }`}
    >
      {label}
    </button>
  );
}
