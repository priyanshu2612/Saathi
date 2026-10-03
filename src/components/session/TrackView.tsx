"use client";

import { useEffect, useRef } from "react";

// Structural type so callers don't need the Agora SDK types (or the SDK
// itself, which is browser-only) just to render a video track.
interface PlayableTrack {
  play: (element: HTMLElement) => void;
  stop: () => void;
}

/** Renders an Agora video track into a div that fills its container. */
export default function TrackView({
  track,
  className = "",
}: {
  track: PlayableTrack | null;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!track || !el) return;
    track.play(el);
    return () => track.stop();
  }, [track]);

  return <div ref={ref} className={`h-full w-full ${className}`} />;
}
