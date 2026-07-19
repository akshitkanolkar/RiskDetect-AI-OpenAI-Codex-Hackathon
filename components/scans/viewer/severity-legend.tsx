"use client";

import { SEVERITY_COLORS } from "@/lib/report/finding-meta";
import type { RiskLevel } from "@/types";
import { cn } from "@/lib/utils";

const LEVELS: RiskLevel[] = ["critical", "high", "medium", "low", "safe"];

export function SeverityLegend({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-xl border border-border/50 bg-background/60 px-3 py-2 text-xs text-muted-foreground backdrop-blur",
        className,
      )}
      role="list"
      aria-label="Severity color legend"
    >
      {LEVELS.map((level) => (
        <span key={level} className="inline-flex items-center gap-1.5 capitalize" role="listitem">
          <span
            className="h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: SEVERITY_COLORS[level] }}
            aria-hidden
          />
          {level}
        </span>
      ))}
    </div>
  );
}
