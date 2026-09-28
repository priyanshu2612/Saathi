"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const BANNERS = [
  {
    src: "/banners/real-conversations.webp",
    alt: "Real conversations — talk openly and confidently",
    width: 1672,
    height: 941,
  },
  {
    src: "/banners/verified-mentors.webp",
    alt: "Verified mentors — for your peace of mind",
    width: 1672,
    height: 941,
  },
  {
    src: "/banners/private-secure.webp",
    alt: "Private & secure — your privacy is always protected",
    width: 1672,
    height: 941,
  },
];

export default function HomeBannerCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % BANNERS.length), 4500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="px-5">
      <div className="overflow-hidden rounded-xl2">
        {BANNERS.map((banner, i) => (
          <div key={banner.src} className={i === index ? "block" : "hidden"}>
            <Image
              src={banner.src}
              alt={banner.alt}
              width={banner.width}
              height={banner.height}
              className="h-auto w-full"
              priority={i === 0}
            />
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex justify-center gap-1.5">
        {BANNERS.map((banner, i) => (
          <button
            key={banner.src}
            onClick={() => setIndex(i)}
            aria-label={`Show banner ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? "w-6 bg-warmth-500" : "w-1.5 bg-linen-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
