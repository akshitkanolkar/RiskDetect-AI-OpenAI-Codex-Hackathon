"use client";

import { motion } from "framer-motion";
import type { ImageFinding } from "@/types/scans";
import { RiskBadge } from "@/components/common/risk-badge";
import { getFindingIcon, SEVERITY_COLORS } from "@/lib/report/finding-meta";
import { cn } from "@/lib/utils";

export function DetectionOrderTimeline({
  findings,
  className,
}: {
  findings: ImageFinding[];
  className?: string;
}) {
  if (!findings.length) return null;

  const ordered = [...findings].sort((a, b) => (a.start ?? 0) - (b.start ?? 0));

  return (
    <section className={cn("glass-panel rounded-2xl p-6", className)}>
      <h2 className="text-card-title">Detection order</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Entities sequenced by appearance in the extracted document.
      </p>
      <ol className="mt-5 space-y-3">
        {ordered.map((finding, index) => {
          const Icon = getFindingIcon(finding.category);
          return (
            <motion.li
              key={finding.id}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/40 px-3 py-2.5"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-xs tabular-nums">
                {index + 1}
              </span>
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{
                  backgroundColor: `color-mix(in oklab, ${SEVERITY_COLORS[finding.risk_level]} 18%, transparent)`,
                  color: SEVERITY_COLORS[finding.risk_level],
                }}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{finding.label}</span>
                <span className="line-clamp-1 font-mono text-xs text-muted-foreground">
                  {finding.value}
                </span>
              </span>
              <RiskBadge level={finding.risk_level} />
            </motion.li>
          );
        })}
      </ol>
    </section>
  );
}
