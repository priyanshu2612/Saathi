"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "@phosphor-icons/react";

type MediaItem = { type: "photo" | "video"; url: string };

interface Props {
  photos: string[];
  videos: string[];
  alt: string;
  heroOverlay?: React.ReactNode;
}

export default function MediaGallery({ photos, videos, alt, heroOverlay }: Props) {
  const media: MediaItem[] = [
    ...photos.map((url): MediaItem => ({ type: "photo", url })),
    ...videos.map((url): MediaItem => ({ type: "video", url })),
  ];
  const [selected, setSelected] = useState(0);
  const active = media[selected];

  return (
    <div>
      <div className="relative h-[380px] w-full bg-dusk-900">
        {!active ? null : active.type === "video" ? (
          <video
            key={active.url}
            src={active.url}
            className="h-full w-full object-cover"
            controls
            autoPlay
            playsInline
          />
        ) : (
          <Image src={active.url} alt={alt} fill priority className="object-cover" />
        )}
        {heroOverlay}
      </div>

      {media.length > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto bg-linen-50 px-4 py-3">
          {media.map((item, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`tap-target relative h-16 w-16 shrink-0 overflow-hidden rounded-xl2 ${
                i === selected ? "ring-2 ring-warmth-500" : "opacity-70"
              }`}
            >
              {item.type === "video" ? (
                <video src={item.url} className="h-full w-full object-cover" muted playsInline preload="metadata" />
              ) : (
                <Image src={item.url} alt={`${alt} ${i + 1}`} fill sizes="64px" className="object-cover" />
              )}
              {item.type === "video" && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                  <Play size={14} weight="fill" className="text-white" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
