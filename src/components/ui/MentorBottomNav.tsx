"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SquaresFour, UserCircle, ClockCounterClockwise } from "@phosphor-icons/react";
import ThemeToggle from "./ThemeToggle";

const ITEMS = [
  { href: "/partner/dashboard", label: "Dashboard", icon: SquaresFour },
  { href: "/partner/history", label: "Seekers", icon: ClockCounterClockwise },
  { href: "/partner/profile", label: "Profile", icon: UserCircle },
];

export default function MentorBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="sticky bottom-0 left-0 right-0 z-20 flex items-center justify-center gap-12 border-t border-linen-200 bg-linen-50/95 px-6 pb-[max(10px,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname?.startsWith(href);
        return (
          <Link key={href} href={href} className="tap-target flex flex-col items-center gap-1 px-2 py-1">
            <Icon size={22} weight={active ? "fill" : "regular"} className={active ? "text-warmth-500" : "text-dusk-400"} />
            <span className={`text-[11px] font-medium ${active ? "text-warmth-500" : "text-dusk-400"}`}>{label}</span>
          </Link>
        );
      })}
      <ThemeToggle />
    </nav>
  );
}
