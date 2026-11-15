"use client";

import { shortDay } from "./format";

export function Card({
  title,
  hint,
  children,
  className = "",
}: {
  title?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl2 border border-linen-200 bg-card p-4 ${className}`}>
      {title && (
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h3 className="text-[13px] font-semibold uppercase tracking-wide text-dusk-700">{title}</h3>
          {hint && <span className="text-[11px] text-dusk-400">{hint}</span>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "good" | "bad";
}) {
  const subColor = tone === "good" ? "text-sage-500" : tone === "bad" ? "text-warmth-600" : "text-dusk-400";
  return (
    <div className="rounded-xl2 border border-linen-200 bg-card p-4">
      <p className="text-[12px] text-dusk-700">{label}</p>
      <p className="mt-1 text-[26px] font-semibold leading-tight tracking-tight text-dusk-900">{value}</p>
      {sub && <p className={`mt-0.5 text-[12px] ${subColor}`}>{sub}</p>}
    </div>
  );
}

export function Grid({ children, cols = 4 }: { children: React.ReactNode; cols?: 2 | 3 | 4 }) {
  const map = {
    2: "grid-cols-2",
    3: "grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
  } as const;
  return <div className={`grid gap-3 ${map[cols]}`}>{children}</div>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 mt-8 text-[18px] font-semibold text-dusk-900 first:mt-0">{children}</h2>;
}

/** Vertical bars for a time series. Labels thin themselves out automatically. */
export function BarChart({
  data,
  format = (v) => String(v),
  color = "bg-warmth-500",
  height = 150,
}: {
  data: { label: string; value: number }[];
  format?: (v: number) => string;
  color?: string;
  height?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const every = Math.max(1, Math.ceil(data.length / 6));
  return (
    <div>
      <div className="flex items-end gap-[2px]" style={{ height }}>
        {data.map((d, i) => (
          <div
            key={i}
            className="group relative flex h-full min-w-0 flex-1 items-end"
            title={`${d.label}: ${format(d.value)}`}
          >
            <div
              className={`w-full rounded-t-[3px] ${color} ${d.value === 0 ? "opacity-20" : ""}`}
              style={{ height: `${Math.max(d.value === 0 ? 2 : 4, (d.value / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-[2px] text-[10px] text-dusk-400">
        {data.map((d, i) => (
          <div key={i} className="min-w-0 flex-1 overflow-visible whitespace-nowrap">
            {i % every === 0 ? d.label : ""}
          </div>
        ))}
      </div>
      <p className="mt-1 text-right text-[11px] text-dusk-400">peak {format(max)}</p>
    </div>
  );
}

/** A series chart with a total/peak summary above. */
export function DailyChart<T extends { d: string }>({
  title,
  rows,
  pick,
  format,
  color,
  total,
}: {
  title: string;
  rows: T[];
  pick: (r: T) => number;
  format?: (v: number) => string;
  color?: string;
  total?: string;
}) {
  const data = rows.map((r) => ({ label: shortDay(r.d), value: pick(r) }));
  return (
    <Card title={title} hint={total}>
      <BarChart data={data} format={format} color={color} />
    </Card>
  );
}

/** Horizontal bar list: label, bar relative to max (or to `of`), value text. */
export function HBars({
  rows,
  of,
  color = "bg-warmth-500",
  emptyText = "No data yet",
}: {
  rows: { label: string; value: number; right?: string }[];
  of?: number;
  color?: string;
  emptyText?: string;
}) {
  if (rows.length === 0) return <p className="text-[13px] text-dusk-400">{emptyText}</p>;
  const max = of ?? Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-2.5">
      {rows.map((r, i) => (
        <li key={i}>
          <div className="flex items-baseline justify-between gap-3 text-[13px]">
            <span className="truncate text-dusk-800">{r.label}</span>
            <span className="shrink-0 font-medium text-dusk-900">{r.right ?? r.value.toLocaleString("en-IN")}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-linen-100">
            <div
              className={`h-full rounded-full ${color}`}
              style={{ width: `${Math.min(100, (r.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Table({
  head,
  rows,
  empty = "Nothing here yet",
}: {
  head: string[];
  rows: React.ReactNode[][];
  empty?: string;
}) {
  if (rows.length === 0) return <p className="text-[13px] text-dusk-400">{empty}</p>;
  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <table className="w-full min-w-max border-collapse text-left text-[13px]">
        <thead>
          <tr className="border-b border-linen-200 text-[11px] uppercase tracking-wide text-dusk-400">
            {head.map((h, i) => (
              <th key={i} className={`py-2 pr-4 font-medium ${i > 0 ? "text-right" : ""}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-linen-200/60 last:border-0">
              {r.map((c, j) => (
                <td key={j} className={`py-2 pr-4 text-dusk-900 ${j > 0 ? "text-right tabular-nums" : ""}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pill({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "good" | "bad" | "warn" }) {
  const cls = {
    default: "bg-linen-100 text-dusk-700",
    good: "bg-sage-400/15 text-sage-600",
    bad: "bg-warmth-50 text-warmth-700",
    warn: "bg-gold-400/20 text-dusk-800",
  }[tone];
  return <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>{children}</span>;
}

export function statusTone(status: string): "default" | "good" | "bad" | "warn" {
  if (status === "completed" || status === "active") return "good";
  if (status === "missed" || status === "declined" || status === "cancelled") return "bad";
  if (status === "ringing") return "warn";
  return "default";
}
