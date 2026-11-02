import LegalPage from "@/components/ui/LegalPage";
import { BUSINESS } from "@/lib/business";

export const metadata = { title: "Contact Us – Sukoon" };

export default function ContactPage() {
  return (
    <LegalPage title="Contact Us">
      <p>
        {BUSINESS.brand} ({BUSINESS.domain}) is operated by {BUSINESS.operator}, an individual
        proprietor. Questions about payments, coins, refunds or your account? Reach us any time.
      </p>
      <ul>
        <li>
          Email: <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
        </li>
        <li>
          Phone: <a href={`tel:${BUSINESS.phone.replace(/\s/g, "")}`}>{BUSINESS.phone}</a>
        </li>
        {BUSINESS.address && <li>Address: {BUSINESS.address}</li>}
        <li>Website: https://{BUSINESS.domain}</li>
      </ul>
      <p>We reply to emails within 2 working days.</p>
    </LegalPage>
  );
}
