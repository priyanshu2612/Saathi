"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAppState } from "@/lib/store";

export default function PartnerEntryPage() {
  const router = useRouter();
  const { mentorClaimed } = useAppState();

  useEffect(() => {
    router.replace(mentorClaimed ? "/partner/dashboard" : "/saathi");
  }, [mentorClaimed, router]);

  return null;
}
