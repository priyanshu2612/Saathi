import Image from "next/image";

export default function Logo({ className = "h-7 w-auto" }: { className?: string }) {
  return (
    <Image
      src="/brand/logo.png"
      alt="Sukoon"
      width={300}
      height={102}
      priority
      className={className}
    />
  );
}
