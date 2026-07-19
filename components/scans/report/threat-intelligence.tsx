"use client";

import { motion } from "framer-motion";
import type { ThreatScenario } from "@/lib/report/derive-intelligence";
import { RiskBadge } from "@/components/common/risk-badge";
import { cn } from "@/lib/utils";
import { SEVERITY_COLORS } from "@/lib/report/finding-meta";

export function ThreatIntelligence({
  scenarios,
  className,
}: {
  scenarios: ThreatScenario[];
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      <div>
        <h2 className="text-card-title">Threat intelligence</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Probable attack scenarios derived from the entities in this report.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {scenarios.map((scenario, index) => (
          <motion.article
            key={scenario.id}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: index * 0.06 }}
            className="relative overflow-hidden rounded-2xl border border-border/60 bg-surface-elevated/80 p-5"
          >
            <div
              className="absolute inset-x-0 top-0 h-1"
              style={{ backgroundColor: SEVERITY_COLORS[scenario.likelihood] }}
              aria-hidden
            />
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-label text-muted-foreground">Scenario {index + 1}</p>
              <RiskBadge level={scenario.likelihood} label={`${scenario.likelihood} likelihood`} />
            </div>
            <h3 className="text-sm font-semibold leading-snug">{scenario.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {scenario.description}
            </p>
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Probability</span>
                <span className="font-mono tabular-nums">{scenario.probability}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: SEVERITY_COLORS[scenario.likelihood] }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${scenario.probability}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
