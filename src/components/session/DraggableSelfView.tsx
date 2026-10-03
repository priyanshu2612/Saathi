"use client";

import { useRef, useState } from "react";

const MARGIN = 12;

/**
 * Self-view window for a video call. Drag it anywhere inside the nearest
 * positioned ancestor; on release it snaps to the closest corner, like
 * WhatsApp / FaceTime.
 */
export default function DraggableSelfView({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  // null until first drag — until then CSS places it at the top-right.
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  const bounds = () => {
    const el = ref.current;
    const parent = el?.offsetParent as HTMLElement | null;
    if (!el || !parent) return null;
    return {
      maxX: parent.clientWidth - el.offsetWidth - MARGIN,
      maxY: parent.clientHeight - el.offsetHeight - MARGIN,
    };
  };

  const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { dx: e.clientX - el.offsetLeft, dy: e.clientY - el.offsetTop };
    setPos({ x: el.offsetLeft, y: el.offsetTop });
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const b = bounds();
    if (!drag.current || !b) return;
    setPos({
      x: clamp(e.clientX - drag.current.dx, MARGIN, b.maxX),
      y: clamp(e.clientY - drag.current.dy, MARGIN, b.maxY),
    });
  };

  const onPointerUp = () => {
    const b = bounds();
    drag.current = null;
    setDragging(false);
    if (!b) return;
    // Snap to the nearest corner.
    setPos((p) =>
      p
        ? {
            x: p.x < (MARGIN + b.maxX) / 2 ? MARGIN : b.maxX,
            y: p.y < (MARGIN + b.maxY) / 2 ? MARGIN : b.maxY,
          }
        : p
    );
  };

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={pos ? { left: pos.x, top: pos.y } : { right: 20, top: 128 }}
      className={`absolute z-10 h-36 w-24 touch-none cursor-grab select-none overflow-hidden rounded-xl2 bg-dusk-900 shadow-warm ${
        dragging ? "cursor-grabbing" : "transition-[left,top] duration-200 ease-out"
      }`}
    >
      {children}
    </div>
  );
}
