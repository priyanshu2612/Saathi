// Explicit locale + options so server-rendered and client-rendered output
// always match — using toLocaleString() with no args renders differently
// depending on the machine/browser's default locale, which breaks React
// hydration.
export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
