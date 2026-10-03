// Gifts a seeker can send a Saathi during a call. Prices are in coins (1 coin ≈ ₹1, so 49 coins ≈ ₹49); the
// Saathi keeps SAATHI_GIFT_SHARE of it. Keep ids/prices in sync with
// supabase/functions/_shared/gifts.ts, which is what the server charges.

export interface Gift {
  id: string;
  name: string;
  image: string;
  coins: number;
}

export const SAATHI_GIFT_SHARE = 0.65;

export const GIFTS: Gift[] = [
  { id: "lollipop", name: "Lollipop", image: "/gifts/lollipop.png", coins: 49 },
  { id: "thank-you", name: "Thank You", image: "/gifts/thank-you.png", coins: 49 },
  { id: "butterfly", name: "Butterfly", image: "/gifts/butterfly.png", coins: 99 },
  { id: "surprise-box", name: "Surprise Box", image: "/gifts/surprise-box.png", coins: 99 },
  { id: "cupcake", name: "Cupcake", image: "/gifts/cupcake.png", coins: 149 },
  { id: "sunflower", name: "Sunflower", image: "/gifts/sunflower.png", coins: 149 },
  { id: "cheers-beer", name: "Cheers", image: "/gifts/cheers-beer.png", coins: 199 },
  { id: "pasta", name: "Pasta", image: "/gifts/pasta.png", coins: 249 },
  { id: "bunny", name: "Bunny", image: "/gifts/bunny.png", coins: 299 },
  { id: "teddy-bear", name: "Teddy Bear", image: "/gifts/teddy-bear.png", coins: 499 },
  { id: "heart-chocolates", name: "Chocolates", image: "/gifts/heart-chocolates.png", coins: 599 },
  { id: "red-heels", name: "Red Heels", image: "/gifts/red-heels.png", coins: 999 },
  { id: "wrap-dress", name: "Wrap Dress", image: "/gifts/wrap-dress.png", coins: 1499 },
  { id: "castle", name: "Castle", image: "/gifts/castle.png", coins: 1999 },
];

export const getGift = (id: string) => GIFTS.find((g) => g.id === id);

export const saathiGiftCoins = (coins: number) => Math.floor(coins * SAATHI_GIFT_SHARE);
