"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ImageFinding } from "@/types/scans";
import { getFindingIcon, SEVERITY_COLORS } from "@/lib/report/finding-meta";
import { rectToPercent } from "@/lib/viewer/image-transforms";
import { cn } from "@/lib/utils";

interface BoundingBoxProps {
  finding: ImageFinding;
  imageWidth: number;
  imageHeight: number;
  selected: boolean;
  hovered: boolean;
  showLabel: boolean;
  blurred: boolean;
  /** Invisible hit target for heatmap mode. */
  ghost?: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

export function BoundingBox({
  finding,
  imageWidth,
  imageHeight,
  selected,
  hovered,
  showLabel,
  blurred,
  ghost = false,
  onSelect,
  onHover,
}: BoundingBoxProps) {
  const reduced = useReducedMotion();
  if (!finding.bbox || imageWidth <= 0 || imageHeight <= 0) return null;

  const pct = rectToPercent(finding.bbox, { width: imageWidth, height: imageHeight });
  const color = SEVERITY_COLORS[finding.risk_level];
  const Icon = getFindingIcon(finding.category);
  const active = selected || hovered;

  return (
    <motion.button
      type="button"
      data-bbox="true"
      className={cn(
        "absolute z-10 overflow-visible rounded-sm border-2 bg-transparent p-0 outline-none transition-[box-shadow,filter]",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        active && "z-20",
      )}
      style={{
        left: `${pct.x}%`,
        top: `${pct.y}%`,
        width: `${pct.width}%`,
        height: `${pct.height}%`,
        borderColor: ghost ? "transparent" : color,
        boxShadow: ghost
          ? undefined
          : active
            ? `0 0 0 2px ${color}, 0 0 24px color-mix(in oklab, ${color} 55%, transparent)`
            : `0 0 0 1px color-mix(in oklab, ${color} 40%, transparent)`,
        backgroundColor: ghost
          ? "transparent"
          : blurred
            ? `color-mix(in oklab, ${color} 25%, hsl(var(--background) / 0.55))`
            : `color-mix(in oklab, ${color} 12%, transparent)`,
        backdropFilter: !ghost && blurred ? "blur(10px)" : undefined,
        WebkitBackdropFilter: !ghost && blurred ? "blur(10px)" : undefined,
      }}
      initial={reduced ? false : { opacity: 0, scale: 0.92 }}
      animate={
        selected && !reduced
          ? { opacity: 1, scale: [1, 1.04, 1], boxShadow: `0 0 0 3px ${color}` }
          : { opacity: 1, scale: 1 }
      }
      transition={
        selected && !reduced
          ? { duration: 0.9, repeat: 1, ease: [0.22, 1, 0.36, 1] }
          : { duration: 0.35 }
      }
      onClick={(e) => {
        e.stopPropagation();
        onSelect(finding.id);
      }}
      onMouseEnter={() => onHover(finding.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(finding.id)}
      onBlur={() => onHover(null)}
      aria-label={`${finding.label}: ${finding.value}. ${finding.risk_level} risk.`}
      aria-pressed={selected}
    >
      {blurred && !ghost && (
        <span
          className="pointer-events-none absolute inset-0 flex items-center justify-center font-mono text-[10px] tracking-widest text-foreground/80"
          aria-hidden
        >
          ████
        </span>
      )}
      {showLabel && !ghost && (
        <span
          className="pointer-events-none absolute -top-6 left-0 flex max-w-[180px] items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium text-white shadow-sm"
          style={{ backgroundColor: color }}
        >
          <Icon className="h-3 w-3 shrink-0" aria-hidden />
          {finding.label}
        </span>
      )}
    </motion.button>
  );
}
