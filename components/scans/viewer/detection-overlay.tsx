"use client";

import type { ImageFinding } from "@/types/scans";
import { BoundingBox } from "@/components/scans/viewer/bounding-box";
import { HeatmapOverlay } from "@/components/scans/viewer/heatmap-overlay";
import type { OverlayMode } from "@/hooks/use-image-viewer";

interface DetectionOverlayProps {
  findings: ImageFinding[];
  imageWidth: number;
  imageHeight: number;
  mode: OverlayMode;
  showLabels: boolean;
  privacyBlur: boolean;
  selectedId: string | null;
  hoveredId: string | null;
  ignoredIds: Set<string>;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

export function DetectionOverlay({
  findings,
  imageWidth,
  imageHeight,
  mode,
  showLabels,
  privacyBlur,
  selectedId,
  hoveredId,
  ignoredIds,
  onSelect,
  onHover,
}: DetectionOverlayProps) {
  const visible = findings.filter((f) => f.bbox && !ignoredIds.has(f.id));

  if (mode === "none") return null;

  return (
    <div className="absolute inset-0 z-10">
      {mode === "heatmap" && (
        <HeatmapOverlay findings={visible} imageWidth={imageWidth} imageHeight={imageHeight} />
      )}

      {mode === "boxes" &&
        visible.map((finding) => (
          <BoundingBox
            key={finding.id}
            finding={finding}
            imageWidth={imageWidth}
            imageHeight={imageHeight}
            selected={selectedId === finding.id}
            hovered={hoveredId === finding.id}
            showLabel={showLabels}
            blurred={privacyBlur}
            onSelect={onSelect}
            onHover={onHover}
          />
        ))}

      {mode === "heatmap" &&
        visible.map((finding) => (
          <BoundingBox
            key={`heat-${finding.id}`}
            finding={finding}
            imageWidth={imageWidth}
            imageHeight={imageHeight}
            selected={selectedId === finding.id}
            hovered={hoveredId === finding.id}
            showLabel={false}
            blurred={false}
            ghost
            onSelect={onSelect}
            onHover={onHover}
          />
        ))}
    </div>
  );
}
