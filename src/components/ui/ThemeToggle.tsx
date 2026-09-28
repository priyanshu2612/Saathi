"use client";

import { Moon, Sun } from "@phosphor-icons/react";
import { useTheme } from "@/lib/theme";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="tap-target flex flex-col items-center gap-1 px-2 py-1"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Moon size={22} weight="fill" className="text-warmth-500" />
      ) : (
        <Sun size={22} weight="regular" className="text-dusk-400" />
      )}
      <span className="text-[11px] font-medium text-dusk-400">
        {isDark ? "Dark" : "Light"}
      </span>
    </button>
  );
}
