"use client";

import { useMemo, useRef, useState } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import type { ImageFinding } from "@/types/scans";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { RiskBadge } from "@/components/common/risk-badge";
import { SEVERITY_COLORS } from "@/lib/report/finding-meta";
import { cn } from "@/lib/utils";

interface TextHeatmapProps {
  text: string;
  findings: ImageFinding[];
  className?: string;
}

type Segment =
  { type: "plain"; text: string } | { type: "hit"; text: string; finding: ImageFinding };

function buildSegments(text: string, findings: ImageFinding[]): Segment[] {
  if (!text.trim()) return [];

  const ranged = findings
    .filter((f) => f.start != null && f.end != null && f.end! > f.start!)
    .map((f) => ({ finding: f, start: f.start!, end: f.end! }))
    .sort((a, b) => a.start - b.start);

  if (ranged.length) {
    const segments: Segment[] = [];
    let cursor = 0;
    for (const range of ranged) {
      if (range.start > cursor) {
        segments.push({ type: "plain", text: text.slice(cursor, range.start) });
      }
      const slice = text.slice(range.start, range.end);
      if (slice) {
        segments.push({ type: "hit", text: slice, finding: range.finding });
      }
      cursor = Math.max(cursor, range.end);
    }
    if (cursor < text.length) {
      segments.push({ type: "plain", text: text.slice(cursor) });
    }
    return segments;
  }

  // Fallback: locate values in text (first occurrence each)
  const segments: Segment[] = [];
  let remaining = text;
  const used = new Set<string>();

  while (remaining.length) {
    let earliest = -1;
    let match: ImageFinding | null = null;
    let matchLen = 0;

    for (const finding of findings) {
      if (used.has(finding.id)) continue;
      const idx = remaining.toLowerCase().indexOf(finding.value.toLowerCase());
      if (idx === -1) continue;
      if (earliest === -1 || idx < earliest) {
        earliest = idx;
        match = finding;
        matchLen = finding.value.length;
      }
    }

    if (!match || earliest === -1) {
      segments.push({ type: "plain", text: remaining });
      break;
    }

    if (earliest > 0) {
      segments.push({ type: "plain", text: remaining.slice(0, earliest) });
    }
    segments.push({
      type: "hit",
      text: remaining.slice(earliest, earliest + matchLen),
      finding: match,
    });
    used.add(match.id);
    remaining = remaining.slice(earliest + matchLen);
  }

  return segments;
}

export function TextHeatmap({ text, findings, className }: TextHeatmapProps) {
  const [zoom, setZoom] = useState(1);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const segments = useMemo(() => buildSegments(text, findings), [text, findings]);

  if (!text.trim()) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-dashed border-border/70 px-6 py-12 text-center",
          className,
        )}
      >
        <p className="text-sm font-medium">No OCR canvas available</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Text-region heatmap complements the interactive image overlay above.
        </p>
      </div>
    );
  }

  return (
    <section className={cn("glass-panel rounded-2xl p-5 sm:p-6", className)}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-card-title">Sensitive data heatmap</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Colored spans mark every validated entity. Hover for guidance · zoom supported.
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            aria-label="Zoom out"
            onClick={() => setZoom((z) => Math.max(0.75, Number((z - 0.1).toFixed(2))))}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center font-mono text-xs tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="outline"
            size="icon"
            aria-label="Zoom in"
            onClick={() => setZoom((z) => Math.min(1.8, Number((z + 0.1).toFixed(2))))}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Reset zoom" onClick={() => setZoom(1)}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
        {(Object.keys(SEVERITY_COLORS) as Array<keyof typeof SEVERITY_COLORS>).map((level) => (
          <span key={level} className="inline-flex items-center gap-1.5 capitalize">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: SEVERITY_COLORS[level] }}
              aria-hidden
            />
            {level}
          </span>
        ))}
      </div>

      <div
        ref={scrollerRef}
        className="max-h-[420px] overflow-auto rounded-xl border border-border/60 bg-[radial-gradient(ellipse_at_top,hsl(var(--brand)/0.06),transparent_55%),hsl(var(--muted)/0.35)] p-4"
      >
        <div
          className="origin-top-left whitespace-pre-wrap break-words font-mono text-sm leading-7 text-foreground/85 transition-transform"
          style={{ transform: `scale(${zoom})`, width: `${100 / zoom}%` }}
        >
          {segments.map((segment, i) => {
            if (segment.type === "plain") {
              return <span key={`p-${i}`}>{segment.text}</span>;
            }
            const color = SEVERITY_COLORS[segment.finding.risk_level];
            return (
              <HoverCard key={`h-${segment.finding.id}-${i}`} openDelay={120}>
                <HoverCardTrigger asChild>
                  <mark
                    className="cursor-help rounded px-0.5 py-0.5 font-medium text-foreground outline-none ring-offset-background transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring"
                    style={{
                      backgroundColor: `color-mix(in oklab, ${color} 38%, transparent)`,
                      boxShadow: `inset 0 -2px 0 ${color}`,
                    }}
                  >
                    {segment.text}
                  </mark>
                </HoverCardTrigger>
                <HoverCardContent className="w-72 space-y-2" align="start">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{segment.finding.label}</p>
                    <RiskBadge level={segment.finding.risk_level} />
                  </div>
                  {(segment.finding.confidence ?? 0) > 0 && (
                    <p className="font-mono text-xs text-muted-foreground">
                      Confidence {segment.finding.confidence}%
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">{segment.finding.recommendation}</p>
                </HoverCardContent>
              </HoverCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
