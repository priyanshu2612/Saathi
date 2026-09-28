"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, ClockCounterClockwise, Wallet, UserCircle, HandHeart } from "@phosphor-icons/react";

const ITEMS = [
  { href: "/home", label: "Home", icon: House },
  { href: "/history", label: "History", icon: ClockCounterClockwise },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/profile", label: "Profile", icon: UserCircle },
  { href: "/partner", label: "Mentor", icon: HandHeart },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="sticky bottom-0 left-0 right-0 z-20 flex items-center justify-between border-t border-linen-200 bg-linen-50/95 px-4 pb-[max(10px,env(safe-area-inset-bottom))] pt-2.5 backdrop-blur">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname?.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="tap-target flex flex-col items-center gap-1 px-2 py-1"
          >
            <Icon
              size={22}
              weight={active ? "fill" : "regular"}
              className={active ? "text-warmth-500" : "text-dusk-400"}
            />
            <span
              className={`text-[11px] font-medium ${
                active ? "text-warmth-500" : "text-dusk-400"
              }`}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
