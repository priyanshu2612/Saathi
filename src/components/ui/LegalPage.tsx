import Link from "next/link";
import Logo from "@/components/ui/Logo";
import LegalLinks from "@/components/ui/LegalLinks";
import { BUSINESS } from "@/lib/business";

export default function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col px-6 pt-8 pb-8">
      <Link href="/welcome">
        <Logo className="h-8 w-auto" />
      </Link>
      <h1 className="font-display mt-6 text-[26px] leading-tight text-dusk-900">{title}</h1>
      <p className="mt-1 text-[12px] text-dusk-400">Last updated: {BUSINESS.updated}</p>
      <div className="mt-5 space-y-4 text-[14px] leading-relaxed text-dusk-700 [&_h2]:mt-6 [&_h2]:text-[16px] [&_h2]:font-semibold [&_h2]:text-dusk-900 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_a]:underline">
        {children}
      </div>
      <div className="mt-auto pt-10">
        <LegalLinks />
      </div>
    </div>
  );
}
