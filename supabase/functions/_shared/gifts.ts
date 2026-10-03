// Server-side gift catalog — the source of truth for prices. Keep ids/prices
// in sync with src/lib/gifts.ts.

export const MENTOR_GIFT_SHARE_PCT = 65;

export const GIFTS: Record<string, { name: string; coins: number }> = {
  lollipop: { name: "Lollipop", coins: 49 },
  "thank-you": { name: "Thank You", coins: 49 },
  butterfly: { name: "Butterfly", coins: 99 },
  "surprise-box": { name: "Surprise Box", coins: 99 },
  cupcake: { name: "Cupcake", coins: 149 },
  sunflower: { name: "Sunflower", coins: 149 },
  "cheers-beer": { name: "Cheers", coins: 199 },
  pasta: { name: "Pasta", coins: 249 },
  bunny: { name: "Bunny", coins: 299 },
  "teddy-bear": { name: "Teddy Bear", coins: 499 },
  "heart-chocolates": { name: "Chocolates", coins: 599 },
  "red-heels": { name: "Red Heels", coins: 999 },
  "wrap-dress": { name: "Wrap Dress", coins: 1499 },
  castle: { name: "Castle", coins: 1999 },
};
