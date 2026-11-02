import LegalPage from "@/components/ui/LegalPage";
import { BUSINESS, COIN_PACKS } from "@/lib/business";

export const metadata = { title: "Pricing – Sukoon" };

export default function PricingPage() {
  return (
    <LegalPage title="Pricing">
      <p>
        {BUSINESS.brand} lets you talk to a verified, trained listener (a &quot;Saathi&quot;) over
        chat, audio or video. You pay with coins. 1 coin is about ₹1 of value. Coins are used for
        time spent in conversations and for in-call gifts.
      </p>
      <h2>Coin packs</h2>
      <ul>
        {COIN_PACKS.map((p) => (
          <li key={p.priceInr}>
            ₹{p.priceInr.toLocaleString("en-IN")} — {p.coins.toLocaleString("en-IN")} coins
          </li>
        ))}
      </ul>
      <p>
        New users get a one-time 50% bonus on their first coin purchase. All prices are in Indian
        Rupees (INR) and include applicable taxes.
      </p>
      <h2>Conversation rates</h2>
      <p>
        Each Saathi&apos;s rate (coins per minute for chat, audio and video) is shown on their
        profile before you start. You are only charged for the time you spend in a conversation.
      </p>
      <h2>Payments</h2>
      <p>Payments are processed securely by Cashfree Payments (UPI, cards, net banking, wallets).</p>
    </LegalPage>
  );
}
