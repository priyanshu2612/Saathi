"use client";

import Image from "next/image";
import Link from "next/link";

export default function CoinBadge({ balance }: { balance: number }) {
  return (
    <Link
      href="/wallet"
      className="tap-target flex items-center gap-1.5 rounded-full bg-linen-100 px-3 py-1.5 border border-linen-200"
    >
      <Image src="/coinstack.png" alt="" width={18} height={18} className="h-[18px] w-[18px] object-contain" />
      <span className="text-[13px] font-semibold text-dusk-900">{balance}</span>
    </Link>
  );
}
