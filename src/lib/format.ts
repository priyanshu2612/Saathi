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

// Approximate rupee value of one coin, from the coin-pack prices (₹99 → 100
// coins up to ₹2,499 → 3,000). Only used for "about ₹X" estimates.
export const COIN_TO_INR = 0.9;

export const coinsToInr = (coins: number) => Math.round(coins * COIN_TO_INR);

export const formatInr = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

// Seekers don't upload photos yet, so give each a stable placeholder portrait
// derived from their name.
export function seekerAvatarUrl(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const group = hash % 2 === 0 ? "men" : "women";
  return `https://randomuser.me/api/portraits/${group}/${hash % 90}.jpg`;
}
