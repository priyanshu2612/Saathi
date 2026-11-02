import LegalPage from "@/components/ui/LegalPage";
import { BUSINESS } from "@/lib/business";

export const metadata = { title: "Refunds & Cancellations – Sukoon" };

export default function RefundPage() {
  return (
    <LegalPage title="Refunds & Cancellations">
      <h2>Unused coins</h2>
      <p>
        If you change your mind, you can request a refund for the unused coins from a purchase
        within 7 days of paying. We refund the rupee value of the unused coins to your original
        payment method.
      </p>
      <h2>Coins already used</h2>
      <p>
        Coins spent on conversations or gifts are not refundable, because the service has already
        been delivered. If a call dropped because of a technical fault on our side, or you were
        charged for time you did not receive, write to us and we will credit the coins back.
      </p>
      <h2>Failed or duplicate payments</h2>
      <p>
        If money was debited but no coins were added, or you were charged twice, contact us with
        the payment details. We will credit the coins or refund the amount.
      </p>
      <h2>How refunds are processed</h2>
      <p>
        Approved refunds go back to the original payment method within 5–7 working days of
        approval, depending on your bank or payment provider.
      </p>
      <h2>Cancellations</h2>
      <p>
        You can end a conversation at any time; billing stops when it ends. Coin purchases cannot
        be cancelled once the payment succeeds, but unused coins can be refunded as described
        above.
      </p>
      <h2>How to request a refund</h2>
      <p>
        Email <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> or call {BUSINESS.phone}{" "}
        with the phone number on your account and the payment date and amount.
      </p>
    </LegalPage>
  );
}
