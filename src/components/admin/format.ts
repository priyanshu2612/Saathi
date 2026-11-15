export const num = (n: number | null | undefined) =>
  n == null ? "–" : Number(n).toLocaleString("en-IN", { maximumFractionDigits: 1 });

export const inr = (n: number | null | undefined) =>
  n == null ? "–" : `₹${Math.round(Number(n)).toLocaleString("en-IN")}`;

export const pct = (a: number, b: number) => (b > 0 ? `${((100 * a) / b).toFixed(1)}%` : "–");

/** Minutes -> "1h 20m" / "45m" / "0m". */
export function mins(m: number | null | undefined): string {
  if (m == null) return "–";
  const total = Math.round(Number(m));
  if (total < 60) return `${total}m`;
  const h = Math.floor(total / 60);
  const r = total % 60;
  return r ? `${h}h ${r}m` : `${h}h`;
}

/** Seconds -> "4m 12s". */
export function secs(s: number | null | undefined): string {
  if (s == null) return "–";
  const t = Math.round(Number(s));
  if (t < 60) return `${t}s`;
  const m = Math.floor(t / 60);
  const r = t % 60;
  return m >= 60 ? mins(t / 60) : `${m}m ${r}s`;
}

export function hoursFromSeconds(s: number): string {
  return mins(s / 60);
}

export function ago(iso: string | null | undefined): string {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function shortDay(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function delta(now: number, before: number): { text: string; up: boolean | null } {
  if (before === 0 && now === 0) return { text: "same as yesterday", up: null };
  if (before === 0) return { text: "new vs yesterday", up: true };
  const p = Math.round(((now - before) / before) * 100);
  return { text: `${p >= 0 ? "+" : ""}${p}% vs yesterday`, up: p === 0 ? null : p > 0 };
}

export function dateTime(iso: string | null | undefined): string {
  if (!iso) return "–";
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

export function dateOnly(iso: string | null | undefined): string {
  if (!iso) return "–";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
