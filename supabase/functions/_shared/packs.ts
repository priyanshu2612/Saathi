// Server-side coin packs — the source of truth for what a payment is worth.
// Keep in sync with COIN_PACKS in src/lib/mock-data.ts.

export const PACKS: Record<string, { priceInr: number; coins: number }> = {
  p1: { priceInr: 249, coins: 250 },
  p2: { priceInr: 499, coins: 550 },
  p3: { priceInr: 999, coins: 1150 },
  p4: { priceInr: 2499, coins: 3000 },
};

// One-time bonus on a seeker's first purchase, as a % of the pack's coins.
export const FIRST_RECHARGE_BONUS_PCT = 20;

// "Recharge within 5 minutes" one-time offer: extra coins on top of the pack,
// and how long the offer lasts (plus a grace period to finish paying).
export const OFFER_BONUS_COINS = 50;
export const OFFER_MINUTES = 5;
export const OFFER_PAY_GRACE_MINUTES = 3;
