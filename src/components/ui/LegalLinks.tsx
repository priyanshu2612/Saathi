import Link from "next/link";

const LINKS = [
  { href: "/pricing", label: "Pricing" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/refund", label: "Refunds & Cancellations" },
  { href: "/contact", label: "Contact Us" },
];

export default function LegalLinks() {
  return (
    <nav className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 text-[12px] text-dusk-400">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className="underline underline-offset-2">
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
