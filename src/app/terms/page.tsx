import LegalPage from "@/components/ui/LegalPage";
import { BUSINESS } from "@/lib/business";

export const metadata = { title: "Terms & Conditions – Sukoon" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms & Conditions">
      <p>
        These terms apply to your use of {BUSINESS.brand} at https://{BUSINESS.domain}, operated
        by {BUSINESS.operator}, an individual proprietor (&quot;we&quot;, &quot;us&quot;). By
        using the service you agree to them.
      </p>
      <h2>The service</h2>
      <p>
        {BUSINESS.brand} connects you with verified, trained listeners (&quot;Saathis&quot;) for
        supportive conversations over chat, audio and video. It is a listening and companionship
        service. It is not medical care, therapy or crisis support. If you are in danger or need
        emergency help, contact local emergency services.
      </p>
      <h2>Eligibility and account</h2>
      <ul>
        <li>You must be 18 or older.</li>
        <li>You sign in with your phone number and a PIN. Keep your PIN private.</li>
        <li>You are responsible for activity on your account.</li>
      </ul>
      <h2>Coins and payments</h2>
      <ul>
        <li>Conversations and gifts are paid for with coins, bought in packs priced in INR.</li>
        <li>Coins have no cash value and cannot be transferred or sold.</li>
        <li>Payments are processed by Cashfree Payments. We do not store your card details.</li>
        <li>Refunds follow our Refunds &amp; Cancellations policy.</li>
      </ul>
      <h2>Acceptable use</h2>
      <p>
        Be respectful. Do not harass, threaten or abuse Saathis, ask for or share explicit
        content, record conversations without consent, or use the service for anything unlawful.
        We may suspend accounts that break these rules.
      </p>
      <h2>Liability</h2>
      <p>
        The service is provided as is. To the extent permitted by law, we are not liable for
        indirect losses, and our total liability is limited to the amount you paid us in the
        previous 30 days.
      </p>
      <h2>Changes and governing law</h2>
      <p>
        We may update these terms; continued use means you accept the update. These terms are
        governed by the laws of India.
      </p>
      <h2>Contact</h2>
      <p>
        <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> · {BUSINESS.phone}
      </p>
    </LegalPage>
  );
}
