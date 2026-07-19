"use client";

import { useMemo } from "react";
import type { ImageFinding } from "@/types/scans";
import { RISK_RANK } from "@/lib/report/finding-meta";
import { cn } from "@/lib/utils";

interface HeatmapOverlayProps {
  findings: ImageFinding[];
  imageWidth: number;
  imageHeight: number;
  className?: string;
}

/**
 * Soft radial heat blobs centered on each detection — denser / hotter for higher severity.
 */
export function HeatmapOverlay({
  findings,
  imageWidth,
  imageHeight,
  className,
}: HeatmapOverlayProps) {
  const blobs = useMemo(() => {
    if (imageWidth <= 0 || imageHeight <= 0) return [];
    return findings
      .filter((f) => f.bbox)
      .map((f) => {
        const box = f.bbox!;
        const cx = ((box.x + box.width / 2) / imageWidth) * 100;
        const cy = ((box.y + box.height / 2) / imageHeight) * 100;
        const radius = Math.max(
          6,
          ((Math.max(box.width, box.height) * 1.8) / Math.min(imageWidth, imageHeight)) * 100,
        );
        const intensity = 0.25 + RISK_RANK[f.risk_level] * 0.14;
        const hue =
          f.risk_level === "critical" || f.risk_level === "high"
            ? 8
            : f.risk_level === "medium"
              ? 38
              : 200;
        return { id: f.id, cx, cy, radius, intensity, hue };
      });
  }, [findings, imageWidth, imageHeight]);

  if (!blobs.length) return null;

  return (
    <div className={cn("pointer-events-none absolute inset-0 z-[5] mix-blend-screen", className)}>
      {blobs.map((blob) => (
        <div
          key={blob.id}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: `${blob.cx}%`,
            top: `${blob.cy}%`,
            width: `${blob.radius * 2}%`,
            height: `${blob.radius * 2}%`,
            background: `radial-gradient(circle, hsla(${blob.hue}, 95%, 55%, ${blob.intensity}) 0%, transparent 70%)`,
          }}
        />
      ))}
    </div>
  );
}
