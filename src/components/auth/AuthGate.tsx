"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppState } from "@/lib/store";

const PUBLIC_PREFIXES = ["/signin", "/partner", "/welcome", "/saathi"];

function isPublic(pathname: string) {
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const { isAuthenticated, hydrated } = useAppState();

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated && !isPublic(pathname)) {
      router.replace("/signin");
    } else if (isAuthenticated && pathname.startsWith("/signin")) {
      router.replace("/home");
    }
  }, [hydrated, isAuthenticated, pathname, router]);

  if (!hydrated) return null;
  if (!isAuthenticated && !isPublic(pathname)) return null;
  return <>{children}</>;
}
