"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowsClockwise, Lock, SignOut } from "@phosphor-icons/react";
import { AdminStats } from "@/components/admin/types";
import { Calls, Money, Overview, SaathiPanel, Users } from "@/components/admin/panels";
import { ago } from "@/components/admin/format";

const TABS = ["Overview", "Users", "Saathi", "Money", "Calls"] as const;
type Tab = (typeof TABS)[number];
const RANGES = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "1y", days: 365 },
];
const REFRESH_MS = 60_000;

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(30);
  const [tab, setTab] = useState<Tab>("Overview");
  const daysRef = useRef(days);
  daysRef.current = days;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/stats?days=${daysRef.current}`, { cache: "no-store" });
      if (res.status === 401) {
        setAuthed(false);
        return;
      }
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Could not load stats.");
      } else {
        setError(null);
        setStats(body);
      }
      setAuthed(true);
    } catch {
      setError("Network error — check your connection.");
      setAuthed((a) => a ?? true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      const t = localStorage.getItem("admin-tab") as Tab | null;
      if (t && (TABS as readonly string[]).includes(t)) setTab(t);
      const d = Number(localStorage.getItem("admin-days"));
      if (d) setDays(d);
    } catch {}
  }, []);

  useEffect(() => {
    if (authed === false) return;
    load();
  }, [days, authed === false, load]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!authed) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [authed, load]);

  const pickTab = (t: Tab) => {
    setTab(t);
    try { localStorage.setItem("admin-tab", t); } catch {}
  };
  const pickDays = (d: number) => {
    setDays(d);
    try { localStorage.setItem("admin-days", String(d)); } catch {}
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setStats(null);
    setAuthed(false);
  };

  if (authed === null) {
    return <div className="grid min-h-screen place-items-center text-sm text-dusk-400">Loading…</div>;
  }
  if (authed === false) {
    return <Login onDone={() => { setAuthed(true); load(); }} />;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      <header className="sticky top-0 z-20 -mx-4 border-b border-linen-200 bg-linen-50/95 px-4 pt-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[18px] font-semibold leading-tight text-dusk-900">Sukoon Admin</h1>
            <p className="text-[11px] text-dusk-400">
              {stats ? `Updated ${ago(stats.generated_at)} · IST days` : "Loading…"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-full border border-linen-200 bg-card p-0.5">
              {RANGES.map((r) => (
                <button
                  key={r.days}
                  onClick={() => pickDays(r.days)}
                  className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${
                    days === r.days ? "bg-dusk-900 text-linen-50" : "text-dusk-700"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <button onClick={load} aria-label="Refresh" className="grid h-8 w-8 place-items-center rounded-full border border-linen-200 bg-card text-dusk-700">
              <ArrowsClockwise size={16} className={loading ? "animate-spin" : ""} />
            </button>
            <button onClick={logout} aria-label="Sign out" className="grid h-8 w-8 place-items-center rounded-full border border-linen-200 bg-card text-dusk-700">
              <SignOut size={16} />
            </button>
          </div>
        </div>
        <nav className="no-scrollbar -mx-4 mt-2 flex gap-1 overflow-x-auto px-4">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => pickTab(t)}
              className={`whitespace-nowrap border-b-2 px-3 py-2 text-[14px] font-medium ${
                tab === t ? "border-warmth-500 text-dusk-900" : "border-transparent text-dusk-400"
              }`}
            >
              {t}
            </button>
          ))}
        </nav>
      </header>

      <main className="pt-5">
        {error && (
          <div className="mb-4 rounded-xl2 border border-warmth-300 bg-warmth-50 p-3 text-[13px] text-warmth-700">
            {error}
            {error.includes("admin_dashboard") && (
              <p className="mt-1 text-dusk-700">
                Run <code>supabase/migrations/0018_admin_dashboard.sql</code> in the Supabase SQL editor.
              </p>
            )}
          </div>
        )}
        {!stats && !error && <p className="text-sm text-dusk-400">Crunching numbers…</p>}
        {stats && (
          <>
            {tab === "Overview" && <Overview s={stats} />}
            {tab === "Users" && <Users s={stats} />}
            {tab === "Saathi" && <SaathiPanel s={stats} />}
            {tab === "Money" && <Money s={stats} />}
            {tab === "Calls" && <Calls s={stats} />}
          </>
        )}
      </main>
    </div>
  );
}

function Login({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) onDone();
      else setErr(body.error ?? "Could not sign in.");
    } catch {
      setErr("Network error.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl2 border border-linen-200 bg-card p-6">
        <div className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-warmth-50 text-warmth-700">
          <Lock size={20} weight="bold" />
        </div>
        <h1 className="text-[20px] font-semibold text-dusk-900">Sukoon Admin</h1>
        <p className="mb-4 mt-1 text-[13px] text-dusk-700">Owner access only.</p>
        <input
          type="password"
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-lg border border-linen-200 bg-linen-50 px-3 py-2.5 text-[15px] text-dusk-900 outline-none focus:border-dusk-700"
        />
        {err && <p className="mt-2 text-[13px] text-warmth-600">{err}</p>}
        <button
          disabled={busy || !password}
          className="mt-4 w-full rounded-lg bg-warmth-500 py-2.5 text-[15px] font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Checking…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
