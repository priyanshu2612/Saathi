"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowsClockwise, CaretLeft, CaretRight, Check, Copy, MagnifyingGlass, Phone, WhatsappLogo, X } from "@phosphor-icons/react";
import { ApplicantPerson, PeopleData, SaathiPerson, UserPerson } from "./types";
import { ago, dateTime, inr, mins, num } from "./format";
import { Pill } from "./ui";

type Kind = "users" | "saathi" | "applicants";
type Sort = "newest" | "recent" | "active";

interface Item {
  kind: Kind;
  id: string;
  code: string;
  name: string;
  phone: string | null;
  photos: string[];
  joined: string;
  lastActive: string | null;
  activeSeconds: number | null;
  badge?: { text: string; tone: "default" | "good" | "bad" | "warn" };
  raw: UserPerson | SaathiPerson | ApplicantPerson;
}

const toItems = (d: PeopleData, kind: Kind): Item[] => {
  if (kind === "users")
    return d.users.map((u) => ({
      kind, id: u.id, code: u.code, name: u.username || u.display_name || "Unnamed", phone: u.phone,
      photos: [], joined: u.joined, lastActive: u.last_active, activeSeconds: u.talk_seconds,
      badge: u.locked ? { text: "Locked", tone: "bad" } : undefined, raw: u,
    }));
  if (kind === "saathi")
    return d.saathi.map((m) => ({
      kind, id: m.id, code: m.code, name: m.name, phone: m.phone,
      photos: [...m.photos, ...m.application_photos.filter((p) => !m.photos.includes(p))],
      joined: m.joined, lastActive: m.last_active, activeSeconds: m.online_seconds,
      badge: m.is_online
        ? { text: "Online", tone: "good" }
        : m.status !== "approved"
        ? { text: m.status, tone: "warn" }
        : undefined,
      raw: m,
    }));
  return d.applicants.map((a) => ({
    kind, id: a.id, code: a.code, name: a.name, phone: a.phone, photos: a.photos,
    joined: a.joined, lastActive: null, activeSeconds: null,
    badge: a.saathi_id
      ? { text: "Onboarded", tone: "good" }
      : { text: a.status, tone: a.status === "rejected" ? "bad" : a.status === "shortlisted" ? "good" : "warn" },
    raw: a,
  }));
};

const SUBTABS: { key: Kind; label: string }[] = [
  { key: "users", label: "Users" },
  { key: "saathi", label: "Saathi" },
  { key: "applicants", label: "Applicants" },
];
const PAGE = 40;

export default function People() {
  const [data, setData] = useState<PeopleData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [kind, setKind] = useState<Kind>("users");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("newest");
  const [shown, setShown] = useState(PAGE);
  const [selected, setSelected] = useState<Item | null>(null);
  const [lightbox, setLightbox] = useState<{ photos: string[]; index: number } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/people", { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) setError(body.error ?? "Could not load people.");
      else {
        setError(null);
        setData(body);
      }
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const items = useMemo(() => (data ? toItems(data, kind) : []), [data, kind]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? items.filter(
          (i) =>
            i.name.toLowerCase().includes(q) ||
            i.code.toLowerCase().includes(q) ||
            (i.phone ?? "").includes(q.replace(/\s|-/g, "")) ||
            (i.raw as SaathiPerson).login_code?.toLowerCase().includes(q)
        )
      : items;
    const t = (s: string | null) => (s ? new Date(s).getTime() : 0);
    return [...filtered].sort((a, b) =>
      sort === "recent"
        ? t(b.lastActive) - t(a.lastActive)
        : sort === "active"
        ? (b.activeSeconds ?? 0) - (a.activeSeconds ?? 0)
        : t(b.joined) - t(a.joined)
    );
  }, [items, query, sort]);

  useEffect(() => setShown(PAGE), [kind, query, sort]);

  // Keep the open detail in sync if data refreshes.
  const current = selected ? items.find((i) => i.id === selected.id) ?? selected : null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-full border border-linen-200 bg-card p-0.5">
          {SUBTABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setKind(t.key)}
              className={`rounded-full px-3 py-1.5 text-[13px] font-medium ${
                kind === t.key ? "bg-dusk-900 text-linen-50" : "text-dusk-700"
              }`}
            >
              {t.label}
              {data && <span className="ml-1 opacity-60">{data[t.key].length}</span>}
            </button>
          ))}
        </div>
        <div className="relative min-w-[180px] flex-1">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dusk-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, phone or code"
            className="w-full rounded-full border border-linen-200 bg-card py-2 pl-9 pr-3 text-[14px] text-dusk-900 outline-none focus:border-dusk-700"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="rounded-full border border-linen-200 bg-card px-3 py-2 text-[13px] text-dusk-900"
        >
          <option value="newest">Newest first</option>
          <option value="recent">Last active</option>
          <option value="active">Most active</option>
        </select>
        <button onClick={load} aria-label="Reload people" className="grid h-9 w-9 place-items-center rounded-full border border-linen-200 bg-card text-dusk-700">
          <ArrowsClockwise size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl2 border border-warmth-300 bg-warmth-50 p-3 text-[13px] text-warmth-700">
          {error}
          {error.includes("admin_people") && (
            <p className="mt-1 text-dusk-700">
              Run <code>supabase/migrations/0019_admin_people.sql</code> in the Supabase SQL editor.
            </p>
          )}
        </div>
      )}
      {!data && !error && <p className="mt-6 text-sm text-dusk-400">Loading people…</p>}

      {data && (
        <>
          <p className="mb-2 mt-4 text-[12px] text-dusk-400">
            {list.length} {list.length === 1 ? "person" : "people"}
            {query && ` matching “${query}”`}
          </p>
          <ul className="overflow-hidden rounded-xl2 border border-linen-200 bg-card">
            {list.slice(0, shown).map((i) => (
              <li key={i.id} className="border-b border-linen-200/70 last:border-0">
                <Row item={i} onOpen={() => setSelected(i)} />
              </li>
            ))}
            {list.length === 0 && <li className="p-6 text-center text-[13px] text-dusk-400">Nobody here yet.</li>}
          </ul>
          {list.length > shown && (
            <button
              onClick={() => setShown((n) => n + PAGE)}
              className="mx-auto mt-4 block rounded-full border border-linen-200 bg-card px-4 py-2 text-[13px] font-medium text-dusk-800"
            >
              Show more ({list.length - shown} left)
            </button>
          )}
        </>
      )}

      {current && (
        <Detail
          item={current}
          onClose={() => setSelected(null)}
          onPhoto={(photos, index) => setLightbox({ photos, index })}
        />
      )}
      {lightbox && <Lightbox {...lightbox} onClose={() => setLightbox(null)} onIndex={(index) => setLightbox({ ...lightbox, index })} />}
    </>
  );
}

/* ───────────── list row ───────────── */

function Row({ item, onOpen }: { item: Item; onOpen: () => void }) {
  const isApplicant = item.kind === "applicants";
  const loginCode = item.kind === "users" ? null : (item.raw as SaathiPerson).login_code;
  return (
    <div className="flex items-center hover:bg-linen-100">
    <button onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-3 pr-2 text-left sm:pl-4">
      <Avatar src={item.photos[0]} name={item.name} size={52} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="truncate text-[15px] font-semibold text-dusk-900">{item.name}</span>
          <code className="rounded bg-linen-100 px-1.5 py-0.5 text-[11px] text-dusk-700">{item.code}</code>
          {loginCode && (
            <code className="rounded bg-warmth-50 px-1.5 py-0.5 text-[11px] font-semibold text-warmth-600">
              Login {loginCode}
            </code>
          )}
          {item.badge && <Pill tone={item.badge.tone}>{item.badge.text}</Pill>}
        </div>
        <p className="mt-0.5 text-[13px] text-dusk-700">{item.phone ?? "No phone"}</p>
        <p className="mt-0.5 text-[12px] text-dusk-400 md:hidden">
          {isApplicant ? "Applied" : "Joined"} {ago(item.joined)}
          {!isApplicant && ` · Last active ${ago(item.lastActive)}`}
          {item.activeSeconds != null && ` · Active ${mins(item.activeSeconds / 60)}`}
        </p>
      </div>
      <div className="hidden shrink-0 gap-8 text-right md:flex">
        <Mini label={isApplicant ? "Applied" : "Joined"} value={ago(item.joined)} />
        {!isApplicant && <Mini label="Last active" value={ago(item.lastActive)} />}
        {item.activeSeconds != null && (
          <Mini label={item.kind === "saathi" ? "Online time" : "Talk time"} value={mins(item.activeSeconds / 60)} />
        )}
      </div>
      <CaretRight size={16} className="shrink-0 text-dusk-400" />
    </button>
    {item.kind !== "users" && <ContactButtons item={item} className="shrink-0 pr-3 sm:pr-4" />}
    </div>
  );
}

/** Digits only, with India's +91 assumed for bare 10-digit numbers. */
function dialNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let d = raw.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  if (d.length === 10) d = "91" + d;
  return d.length >= 11 ? d : null;
}

function ContactButtons({ item, className = "" }: { item: Item; className?: string }) {
  const wa = (item.raw as SaathiPerson | ApplicantPerson).whatsapp;
  const call = dialNumber(item.phone);
  const chat = dialNumber(wa) ?? call;
  const base = "grid h-9 w-9 place-items-center rounded-full border";
  const off = "pointer-events-none border-linen-200 text-dusk-400/50";
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <a
        href={call ? `tel:+${call}` : undefined}
        aria-label={`Call ${item.name}`}
        title={call ? `Call +${call}` : "No phone number"}
        className={`${base} ${call ? "border-sage-300 bg-sage-400/10 text-sage-600" : off}`}
      >
        <Phone size={17} weight="fill" />
      </a>
      <a
        href={chat ? `https://wa.me/${chat}` : undefined}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`WhatsApp ${item.name}`}
        title={chat ? `WhatsApp +${chat}` : "No number"}
        className={`${base} ${chat ? "border-[#25D366]/40 bg-[#25D366]/10 text-[#128C7E]" : off}`}
      >
        <WhatsappLogo size={18} weight="fill" />
      </a>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-dusk-400">{label}</p>
      <p className="text-[13px] font-medium text-dusk-900">{value}</p>
    </div>
  );
}

function Avatar({ src, name, size }: { src?: string; name: string; size: number }) {
  const [broken, setBroken] = useState(false);
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return src && !broken ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      onError={() => setBroken(true)}
      className="shrink-0 rounded-full bg-linen-100 object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className="grid shrink-0 place-items-center rounded-full bg-warmth-50 font-semibold text-warmth-700"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initial}
    </div>
  );
}

/* ───────────── detail panel ───────────── */

function Detail({ item, onClose, onPhoto }: { item: Item; onClose: () => void; onPhoto: (p: string[], i: number) => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const body =
    item.kind === "users" ? (
      <UserDetail u={item.raw as UserPerson} />
    ) : item.kind === "saathi" ? (
      <SaathiDetail m={item.raw as SaathiPerson} />
    ) : (
      <ApplicantDetail a={item.raw as ApplicantPerson} />
    );

  return (
    <div className="fixed inset-0 z-40 flex">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/50" />
      <aside className="relative ml-auto h-full w-full max-w-xl overflow-y-auto bg-linen-50 shadow-float">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-linen-200 bg-linen-50/95 px-4 py-3 backdrop-blur">
          <span className="text-[13px] font-semibold uppercase tracking-wide text-dusk-700">
            {item.kind === "users" ? "User" : item.kind === "saathi" ? "Saathi" : "Applicant"}
          </span>
          <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full border border-linen-200 bg-card">
            <X size={16} />
          </button>
        </div>

        <div className="px-4 pb-10 pt-5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => item.photos.length && onPhoto(item.photos, 0)}
              className={`shrink-0 ${item.photos.length ? "cursor-zoom-in" : "cursor-default"}`}
            >
              <Avatar src={item.photos[0]} name={item.name} size={84} />
            </button>
            <div className="min-w-0">
              <h2 className="truncate text-[20px] font-semibold text-dusk-900">{item.name}</h2>
              <p className="text-[14px] text-dusk-700">{item.phone ?? "No phone"}</p>
              {item.kind !== "users" && <ContactButtons item={item} className="mt-2" />}
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <CopyCode label="ID" value={item.code} />
                {(item.raw as SaathiPerson).login_code && (
                  <CopyCode label="Login" value={(item.raw as SaathiPerson).login_code as string} />
                )}
                {item.badge && <Pill tone={item.badge.tone}>{item.badge.text}</Pill>}
              </div>
            </div>
          </div>

          {item.photos.length > 0 && (
            <section className="mt-6">
              <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-dusk-700">
                Photos ({item.photos.length})
              </h3>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {item.photos.map((p, i) => (
                  <button key={p} onClick={() => onPhoto(item.photos, i)} className="relative aspect-square cursor-zoom-in overflow-hidden rounded-lg bg-linen-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p} alt="" className="h-full w-full object-cover" />
                    {i === 0 && <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">Profile</span>}
                  </button>
                ))}
              </div>
            </section>
          )}

          {body}
        </div>
      </aside>
    </div>
  );
}

type Field = [string, React.ReactNode];

function KV({ title, rows }: { title: string; rows: Field[] }) {
  const filled = rows.filter(([, v]) => v !== null && v !== undefined && v !== "" && v !== "–");
  if (filled.length === 0) return null;
  return (
    <section className="mt-6">
      <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-dusk-700">{title}</h3>
      <dl className="divide-y divide-linen-200/70 rounded-xl2 border border-linen-200 bg-card">
        {filled.map(([k, v]) => (
          <div key={k} className="flex gap-4 px-3 py-2.5 text-[13px]">
            <dt className="w-36 shrink-0 text-dusk-400">{k}</dt>
            <dd className="min-w-0 flex-1 break-words text-dusk-900">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

const list = (v: string[] | null | undefined) => (v && v.length ? v.join(", ") : "");

function UserDetail({ u }: { u: UserPerson }) {
  return (
    <>
      <KV title="Activity" rows={[
        ["Joined", dateTime(u.joined)],
        ["Last active", u.last_active ? `${dateTime(u.last_active)} (${ago(u.last_active)})` : "Never"],
        ["Total talk time", mins(u.talk_seconds / 60)],
        ["Connected sessions", u.sessions],
        ["Requests made", u.requests],
      ]} />
      <KV title="Money" rows={[
        ["Purchases", u.purchases],
        ["Total spent", inr(u.spent_inr)],
        ["Coin balance", num(u.balance)],
        ["Gifts sent", `${u.gifts_sent} (${num(u.gift_coins)} coins)`],
      ]} />
      <KV title="Account" rows={[
        ["Username", u.username],
        ["Display name", u.display_name],
        ["Phone", u.phone],
        ["Age", u.age],
        ["Sign-in lock", u.locked ? "Locked after wrong PINs" : "Not locked"],
      ]} />
    </>
  );
}

function SaathiDetail({ m }: { m: SaathiPerson }) {
  return (
    <>
      <KV title="Activity" rows={[
        ["Registered", dateTime(m.joined)],
        ["Last active", m.last_active ? `${dateTime(m.last_active)} (${ago(m.last_active)})` : "Never"],
        ["Total online time", `${mins(m.online_seconds / 60)} over ${m.online_days} days`],
        ["Total talk time", mins(m.talk_seconds / 60)],
        ["Connected sessions", m.sessions],
        ["Rating", m.rating ? `${m.rating} ★` : "–"],
        ["Earned", `${num(m.earned_coins)} coins`],
        ["Wallet (owed)", `${num(m.wallet)} coins`],
      ]} />
      <KV title="Contact" rows={[
        ["Phone", m.phone],
        ["WhatsApp", m.whatsapp],
        ["Login code", m.login_code],
        ["Status", m.status],
      ]} />
      <KV title="Profile" rows={[
        ["Tagline", m.tagline],
        ["Bio", m.bio],
        ["Topics", list(m.tags)],
        ["Languages", list(m.languages)],
        ["Communication", list(m.communication_tags)],
        ["Personality", list(m.personality_tags)],
        ["Rates / min", [m.rate_chat && `Chat ${m.rate_chat}`, m.rate_audio && `Audio ${m.rate_audio}`, m.rate_video && `Video ${m.rate_video}`].filter(Boolean).join(" · ")],
      ]} />
      <KV title="Personal" rows={[
        ["Age", m.age], ["Gender", m.gender], ["Nationality", m.nationality], ["Born in", m.born_city],
        ["Qualification", m.qualification], ["College", m.college], ["School", m.school], ["Religion", m.religion],
      ]} />
    </>
  );
}

function ApplicantDetail({ a }: { a: ApplicantPerson }) {
  return (
    <>
      <KV title="Application" rows={[
        ["Applied", dateTime(a.joined)],
        ["Status", a.status],
        ["Onboarded as Saathi", a.saathi_id ? "Yes" : "Not yet"],
        ["Login code", a.login_code ? `${a.login_code}${a.invite_status ? ` (${a.invite_status})` : ""}` : ""],
      ]} />
      <KV title="Contact" rows={[["Phone", a.phone], ["WhatsApp", a.whatsapp], ["City", a.city]]} />
      <KV title="About" rows={[
        ["Age", a.age],
        ["Profession", a.profession],
        ["Languages", [list(a.languages), a.languages_other].filter(Boolean).join(", ")],
        ["Topics", list(a.topics)],
        ["Modes", list(a.modes)],
        ["Hours / week", a.hours_per_week],
        ["Available", list(a.availability_times)],
        ["Quiet space", a.quiet_space],
        ["Heard about us", a.heard_about],
      ]} />
    </>
  );
}

function CopyCode({ label, value }: { label: string; value: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(value).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1200);
        }).catch(() => {});
      }}
      title="Copy"
      className="inline-flex items-center gap-1 rounded-md bg-linen-100 px-2 py-1 text-[12px] text-dusk-800"
    >
      <span className="text-dusk-400">{label}</span>
      <code className="font-semibold">{value}</code>
      {done ? <Check size={12} /> : <Copy size={12} className="text-dusk-400" />}
    </button>
  );
}

/* ───────────── photo lightbox ───────────── */

function Lightbox({ photos, index, onClose, onIndex }: { photos: string[]; index: number; onClose: () => void; onIndex: (i: number) => void }) {
  const go = useCallback(
    (d: number) => onIndex((index + d + photos.length) % photos.length),
    [index, photos.length, onIndex]
  );
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={onClose}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photos[index]} alt="" className="max-h-[88vh] max-w-[94vw] rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
      <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white">
        <X size={20} />
      </button>
      {photos.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Previous" className="absolute left-3 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white">
            <CaretLeft size={20} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Next" className="absolute right-3 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white">
            <CaretRight size={20} />
          </button>
          <span className="absolute bottom-4 rounded-full bg-white/15 px-3 py-1 text-[12px] text-white">
            {index + 1} / {photos.length}
          </span>
        </>
      )}
    </div>
  );
}
