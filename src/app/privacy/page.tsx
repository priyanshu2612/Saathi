import LegalPage from "@/components/ui/LegalPage";
import { BUSINESS } from "@/lib/business";

export const metadata = { title: "Privacy Policy – Sukoon" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        This policy explains what {BUSINESS.brand} (https://{BUSINESS.domain}, operated by{" "}
        {BUSINESS.operator}) collects and how it is used.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li>Your phone number and a hashed PIN, to create and secure your account.</li>
        <li>Your name or nickname and preferences you choose in the app.</li>
        <li>Your coin balance and transaction history.</li>
        <li>Chat messages and call connection data needed to run a conversation.</li>
        <li>Basic technical data such as device type and error logs.</li>
      </ul>
      <h2>Payments</h2>
      <p>
        Payments are handled by Cashfree Payments. Card, UPI and bank details are entered on
        Cashfree&apos;s secure page and are never stored by us. We receive only the payment
        status and amount.
      </p>
      <h2>How we use it</h2>
      <p>
        To run the service, connect you with a Saathi, process payments, prevent abuse, give
        support and improve the app. We do not sell your data or use it for third-party
        advertising.
      </p>
      <h2>Sharing</h2>
      <p>
        We share data only with providers who help run the service (hosting, database, voice and
        video, SMS and payments) or when the law requires it.
      </p>
      <h2>Calls</h2>
      <p>We do not record the audio or video of your calls.</p>
      <h2>Your choices</h2>
      <p>
        You can ask us to access, correct or delete your account and data by emailing{" "}
        <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>.
      </p>
      <h2>Security and retention</h2>
      <p>
        Data is stored with access controls and encrypted in transit. We keep it while your
        account is active and as needed for legal and accounting purposes.
      </p>
    </LegalPage>
  );
}
