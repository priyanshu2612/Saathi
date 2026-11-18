"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Briefcase,
  CalendarBlank,
  CheckCircle,
  ChatCircleDots,
  Copy,
  IdentificationBadge,
  Phone,
  VideoCamera,
  Wallet,
} from "@phosphor-icons/react";
import MentorBottomNav from "@/components/ui/MentorBottomNav";
import SupportRow from "@/components/ui/SupportRow";
import { PAYOUT_DAYS } from "@/lib/business";
import { getMentorId, getSaathiProfile, SaathiOwnProfile } from "@/lib/data/backend";
import { seekerAvatarUrl } from "@/lib/format";
import { isDemoMode } from "@/lib/supabase/client";
import { useAppState } from "@/lib/store";

// Saathis keep this share of what a Seeker pays per minute.
const SAATHI_SHARE = 0.65;

export default function SaathiProfilePage() {
  const { mentorProfile } = useAppState();
  const [profile, setProfile] = useState<SaathiOwnProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (isDemoMode) {
      setProfile({
        name: mentorProfile.name,
        phone: null,
        loginCode: null,
        age: mentorProfile.age ?? null,
        profession: mentorProfile.qualification || null,
        topics: mentorProfile.tags,
        languages: mentorProfile.languages,
        modes: ["Chat", "Audio call", "Video call"],
        photos: mentorProfile.photos,
        rateAudio: mentorProfile.rateAudio,
        rateVideo: mentorProfile.rateVideo,
      });
      setLoading(false);
      return;
    }
    const mentorId = getMentorId();
    if (!mentorId) {
      setError("You're not signed in as a Saathi.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getSaathiProfile(mentorId)
      .then(setProfile)
      .catch(() => setError("Couldn't load your profile. Check your connection and try again."))
      .finally(() => setLoading(false));
  }, [mentorProfile]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 pb-6">
        {loading && <ProfileSkeleton />}

        {!loading && error && (
          <div className="px-5 pt-10 text-center">
            <p className="text-[14px] text-dusk-700">{error}</p>
            <button
              onClick={load}
              className="tap-target mt-4 rounded-full bg-warmth-500 px-6 py-2.5 text-[14px] font-medium text-white"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && profile && <ProfileView p={profile} />}

        {!loading && (
          <div className="mx-5 mt-6 flex flex-col gap-3">
            <SupportRow />
            <p className="flex items-center gap-2 rounded-xl2 bg-linen-100 px-4 py-3 text-[12.5px] text-dusk-700">
              <Wallet size={16} weight="fill" className="shrink-0 text-warmth-500" />
              Payouts are settled within {PAYOUT_DAYS} days of earning.
            </p>
          </div>
        )}
      </div>
      <MentorBottomNav />
    </div>
  );
}

function ProfileView({ p }: { p: SaathiOwnProfile }) {
  const rates = [
    { label: "Audio call", icon: Phone, rate: p.rateAudio },
    { label: "Video call", icon: VideoCamera, rate: p.rateVideo },
  ];

  return (
    <>
      <PhotoStrip photos={p.photos} name={p.name} />

      <div className="px-5 pt-5">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-[26px] leading-tight text-dusk-900">{p.name}</h1>
          <CheckCircle size={20} weight="fill" className="shrink-0 text-sage-400" aria-label="Verified Saathi" />
        </div>
        <p className="mt-0.5 text-[13px] text-dusk-400">Your Saathi profile, as you applied</p>
      </div>

      <Card title="Account">
        <InfoRow icon={Phone} label="Phone" value={p.phone ? `+91 ${p.phone}` : "—"} />
        <InfoRow icon={CalendarBlank} label="Age" value={p.age ? `${p.age} years` : "—"} />
        <InfoRow icon={Briefcase} label="Profession" value={p.profession || "—"} />
        <LoginCodeRow code={p.loginCode} />
      </Card>

      <Card title="Topics you talk about">
        <Chips items={p.topics} empty="No topics added" />
      </Card>

      <Card title="Languages">
        <Chips items={p.languages} empty="No languages added" />
      </Card>

      <Card title="Ways you talk">
        <Chips items={p.modes} empty="No modes added" />
      </Card>

      <Card title="Your call rates">
        <div className="grid grid-cols-2 gap-2">
          {rates.map(({ label, icon: Icon, rate }) => (
            <div key={label} className="rounded-xl2 bg-card p-3 text-center">
              <Icon size={20} weight="fill" className="mx-auto text-warmth-500" />
              <p className="mt-1 text-[12px] text-dusk-400">{label}</p>
              {rate ? (
                <>
                  <p className="text-[16px] font-semibold text-dusk-900">{rate} coins/min</p>
                  <p className="text-[11px] text-sage-500">
                    You earn {Math.round(rate * SAATHI_SHARE)} coins/min
                  </p>
                </>
              ) : (
                <p className="mt-1 text-[12px] text-dusk-400">Set by the Sukoon team</p>
              )}
            </div>
          ))}
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[12px] text-dusk-400">
          <ChatCircleDots size={14} weight="fill" className="text-warmth-500" />
          Chat is free for everyone. Rates are set by the Sukoon team.
        </p>
      </Card>
    </>
  );
}

function PhotoStrip({ photos, name }: { photos: string[]; name: string }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const list = photos.length > 0 ? photos : [seekerAvatarUrl(name)];

  return (
    <div className="relative">
      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {list.map((src) => (
          <div key={src} className="aspect-[4/5] w-full shrink-0 snap-center overflow-hidden bg-linen-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={name} className="h-full w-full object-cover object-top" />
          </div>
        ))}
      </div>
      {list.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {list.map((src, i) => (
            <span
              key={src}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-white" : "w-1.5 bg-white/60"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mx-5 mt-4 rounded-xl2 bg-linen-100 p-4">
      <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-warmth-500">{title}</h2>
      {children}
    </section>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-linen-200 py-2.5 last:border-0 last:pb-0 first:pt-0">
      <Icon size={18} className="shrink-0 text-dusk-400" />
      <span className="w-20 shrink-0 text-[13px] text-dusk-400">{label}</span>
      <span className="min-w-0 flex-1 truncate text-right text-[14px] font-medium text-dusk-900">{value}</span>
    </div>
  );
}

function LoginCodeRow({ code }: { code: string | null }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-3 pt-2.5">
      <IdentificationBadge size={18} className="shrink-0 text-dusk-400" />
      <span className="w-20 shrink-0 text-[13px] text-dusk-400">Login code</span>
      <span className="min-w-0 flex-1 text-right text-[14px] font-semibold tracking-wide text-dusk-900">
        {code ?? "—"}
      </span>
      {code && (
        <button
          onClick={() => {
            navigator.clipboard?.writeText(code).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            });
          }}
          aria-label="Copy login code"
          className="tap-target flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card text-dusk-700"
        >
          {copied ? <CheckCircle size={16} weight="fill" className="text-sage-500" /> : <Copy size={16} />}
        </button>
      )}
    </div>
  );
}

function Chips({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) return <p className="text-[13px] text-dusk-400">{empty}</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className="rounded-full bg-card px-3 py-1.5 text-[13px] text-dusk-800">
          {item}
        </span>
      ))}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/5] w-full bg-linen-100" />
      <div className="mx-5 mt-5 h-7 w-40 rounded bg-linen-100" />
      <div className="mx-5 mt-4 h-40 rounded-xl2 bg-linen-100" />
      <div className="mx-5 mt-4 h-24 rounded-xl2 bg-linen-100" />
    </div>
  );
}
