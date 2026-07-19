"use client";

import { useRef } from "react";
import type { Point, Rect, Size } from "@/lib/viewer/image-transforms";
import { cn } from "@/lib/utils";

interface MiniMapProps {
  imageSrc: string;
  image: Size;
  viewport: Rect;
  scale: number;
  onNavigate: (offset: Point) => void;
  container: Size;
  className?: string;
}

export function MiniMap({
  imageSrc,
  image,
  viewport,
  scale,
  onNavigate,
  container,
  className,
}: MiniMapProps) {
  const ref = useRef<HTMLButtonElement>(null);
  if (scale <= 1.05 || image.width <= 0) return null;

  const mapW = 140;
  const mapH = Math.max(80, (mapW * image.height) / image.width);

  const vx = (viewport.x / image.width) * mapW;
  const vy = (viewport.y / image.height) * mapH;
  const vw = (viewport.width / image.width) * mapW;
  const vh = (viewport.height / image.height) * mapH;

  function handleClick(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * image.width;
    const my = ((e.clientY - rect.top) / rect.height) * image.height;
    onNavigate({
      x: container.width / 2 - mx * scale,
      y: container.height / 2 - my * scale,
    });
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      className={cn(
        "absolute bottom-3 right-3 z-30 overflow-hidden rounded-lg border border-border/80 bg-background/90 shadow-medium backdrop-blur",
        className,
      )}
      style={{ width: mapW, height: mapH }}
      aria-label="Navigator minimap. Click to pan."
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageSrc}
        alt=""
        className="h-full w-full object-contain opacity-80"
        draggable={false}
      />
      <span
        className="pointer-events-none absolute border-2 border-brand bg-brand/20"
        style={{ left: vx, top: vy, width: Math.max(8, vw), height: Math.max(8, vh) }}
        aria-hidden
      />
    </button>
  );
}
