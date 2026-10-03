"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ClockCounterClockwise,
  ShieldCheck,
  FileText,
  TrashSimple,
  Question,
  MoonStars,
  SignOut,
  CaretRight,
  HandHeart,
} from "@phosphor-icons/react";
import BottomNav from "@/components/ui/BottomNav";
import { useAppState } from "@/lib/store";
import { useTheme } from "@/lib/theme";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-1 pb-2 text-[12px] font-semibold uppercase tracking-wide text-dusk-400">
      {children}
    </p>
  );
}

function Row({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  onClick,
  right,
}: {
  icon: typeof ClockCounterClockwise;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  onClick?: () => void;
  right?: React.ReactNode;
}) {
  const content = (
    <>
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
        <Icon size={17} weight="fill" className={iconColor} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium text-dusk-900">{title}</p>
        {subtitle && <p className="truncate text-[12px] text-dusk-400">{subtitle}</p>}
      </div>
      {right ?? <CaretRight size={16} className="shrink-0 text-dusk-400" />}
    </>
  );

  if (!onClick) {
    return <div className="flex items-center gap-3 px-4 py-3.5">{content}</div>;
  }
  return (
    <button type="button" onClick={onClick} className="tap-target flex w-full items-center gap-3 px-4 py-3.5 text-left">
      {content}
    </button>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <p className="text-[13px] text-dusk-400">{label}</p>
      <p className="text-[14px] font-medium text-dusk-900">{value}</p>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-linen-200/60" />;
}

export default function ProfilePage() {
  const router = useRouter();
  const { phoneNumber, username, age, coinBalance, logOut } = useAppState();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const handleLogOut = () => {
    logOut();
    router.replace("/signin");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="px-5 pt-6">
        <h1 className="font-display text-[22px] text-dusk-900">Profile</h1>
      </div>

      <div className="mx-5 mt-4 flex items-center justify-between rounded-xl2 bg-linen-100 px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <Image src="/coinstack.png" alt="" width={28} height={28} className="h-7 w-7 object-contain" />
          <div>
            <p className="text-[13px] text-dusk-400">Your balance</p>
            <p className="text-[16px] font-semibold text-dusk-900">{coinBalance} coins</p>
          </div>
        </div>
        <button
          onClick={() => router.push("/wallet")}
          className="tap-target rounded-full bg-warmth-500 px-4 py-2 text-[13px] font-medium text-white"
        >
          Recharge
        </button>
      </div>

      <div className="mt-6 flex-1 px-5 pb-6">
        <SectionLabel>Your details</SectionLabel>
        <div className="mb-6 overflow-hidden rounded-xl3 border border-linen-200/60 bg-card">
          <DetailRow label="Username" value={username || "—"} />
          <Divider />
          <DetailRow label="Age" value={age ? String(age) : "Not set"} />
          <Divider />
          <DetailRow label="Phone number" value={phoneNumber ? `+91 ${phoneNumber}` : "—"} />
          <Divider />
          {/* The PIN is stored only as a hash on the server, so it can't be
              shown back — the dots just confirm one is set. */}
          <DetailRow label="PIN code" value="••••" />
        </div>

        <SectionLabel>Account</SectionLabel>
        <div className="overflow-hidden rounded-xl3 border border-linen-200/60 bg-card">
          <Row
            icon={ClockCounterClockwise}
            iconBg="bg-amber-50 dark:bg-amber-400/10"
            iconColor="text-amber-600 dark:text-amber-300"
            title="Booking History"
            subtitle="Your past & upcoming sessions"
            onClick={() => router.push("/history")}
          />
          <Divider />
          <Row
            icon={ShieldCheck}
            iconBg="bg-sage-50 dark:bg-sage-400/10"
            iconColor="text-sage-500"
            title="Privacy & Safety"
            subtitle="Data, security settings"
          />
          <Divider />
          <Row
            icon={FileText}
            iconBg="bg-indigo-50 dark:bg-indigo-400/10"
            iconColor="text-indigo-500"
            title="Terms of Use"
            subtitle="Terms & conditions"
          />
          <Divider />
          <Row
            icon={TrashSimple}
            iconBg="bg-red-50 dark:bg-red-400/10"
            iconColor="text-red-500"
            title="Delete Account"
            subtitle="Permanently remove your data"
          />
        </div>

        <div className="mt-6">
          <SectionLabel>Appearance</SectionLabel>
          <div className="overflow-hidden rounded-xl3 border border-linen-200/60 bg-card">
            <Row
              icon={MoonStars}
              iconBg="bg-dusk-100 dark:bg-white/10"
              iconColor="text-dusk-700 dark:text-white"
              title="Dark Mode"
              subtitle={isDark ? "On" : "Off"}
              right={
                <button
                  type="button"
                  role="switch"
                  aria-checked={isDark}
                  aria-label="Toggle dark mode"
                  onClick={toggleTheme}
                  className={`tap-target relative h-6 w-11 shrink-0 rounded-full transition ${
                    isDark ? "bg-warmth-500" : "bg-linen-200"
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      isDark ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              }
            />
          </div>
        </div>

        <div className="mt-6">
          <SectionLabel>Earn with us</SectionLabel>
          <div className="overflow-hidden rounded-xl3 border border-linen-200/60 bg-card">
            <Row
              icon={HandHeart}
              iconBg="bg-warmth-50"
              iconColor="text-warmth-500"
              title="Become a Saathi"
              subtitle="Earn by listening — apply in 5 minutes"
              onClick={() => router.push("/saathi")}
            />
          </div>
        </div>

        <div className="mt-6">
          <SectionLabel>Support</SectionLabel>
          <div className="overflow-hidden rounded-xl3 border border-linen-200/60 bg-card">
            <Row
              icon={Question}
              iconBg="bg-pink-50 dark:bg-pink-400/10"
              iconColor="text-pink-500"
              title="Help Center"
              subtitle="FAQs and guides"
            />
          </div>
        </div>

        <button
          onClick={handleLogOut}
          className="tap-target mt-6 flex w-full items-center justify-center gap-2 rounded-xl3 border border-red-200 py-3.5 text-[14px] font-semibold text-red-500"
        >
          <SignOut size={17} />
          Log Out
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
