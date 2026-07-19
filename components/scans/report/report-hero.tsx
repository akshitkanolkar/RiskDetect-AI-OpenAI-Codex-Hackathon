"use client";

import { format } from "date-fns";
import { Activity, Brain, Clock, FileSearch, ShieldAlert, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { RiskGauge } from "@/components/scans/risk-gauge";
import { ConfidenceMeter } from "@/components/scans/confidence-meter";
import { RiskBadge } from "@/components/common/risk-badge";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/report/derive-intelligence";
import type { RiskLevel } from "@/types";

interface ReportHeroProps {
  riskScore: number;
  riskLevel: RiskLevel;
  confidence: number;
  findings: number;
  sensitive: number;
  threats: number;
  processingMs: number;
  model: string;
  date: string;
  subtitle: string;
  className?: string;
}

export function ReportHero({
  riskScore,
  riskLevel,
  confidence,
  findings,
  sensitive,
  threats,
  processingMs,
  model,
  date,
  subtitle,
  className,
}: ReportHeroProps) {
  const stats = [
    { label: "Findings", value: String(findings), icon: FileSearch },
    { label: "Sensitive data", value: String(sensitive), icon: ShieldAlert },
    { label: "Threats", value: String(threats), icon: Activity },
    { label: "Processing", value: formatDuration(processingMs), icon: Clock },
  ];

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-surface-elevated via-surface to-brand-muted/30 p-6 shadow-glass sm:p-8",
        className,
      )}
      aria-labelledby="report-hero-title"
    >
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-risk-high/10 blur-3xl"
        aria-hidden
      />

      <div className="relative grid gap-8 lg:grid-cols-[220px_1fr]">
        <div className="flex flex-col items-center justify-center">
          <RiskGauge score={riskScore} level={riskLevel} />
          <p id="report-hero-title" className="text-label mt-2 text-muted-foreground">
            Overall risk
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <RiskBadge level={riskLevel} label={riskLevel.toUpperCase()} />
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/50 px-2.5 py-0.5 text-xs text-muted-foreground backdrop-blur">
                  <Sparkles className="h-3 w-3 text-brand" aria-hidden />
                  Security Intelligence Report
                </span>
              </div>
              <h2 className="text-section tracking-tight text-foreground">
                Risk posture at a glance
              </h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">{subtitle}</p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p>{format(new Date(date), "MMM d, yyyy · HH:mm")}</p>
              <p className="mt-1 inline-flex items-center gap-1">
                <Brain className="h-3 w-3" aria-hidden />
                {model}
              </p>
            </div>
          </div>

          <ConfidenceMeter value={confidence} />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.06, duration: 0.35 }}
                className="rounded-2xl border border-border/50 bg-background/40 p-3 backdrop-blur-sm"
              >
                <div className="mb-2 flex items-center gap-1.5 text-muted-foreground">
                  <stat.icon className="h-3.5 w-3.5" aria-hidden />
                  <span className="text-[11px] uppercase tracking-wider">{stat.label}</span>
                </div>
                <p className="font-mono text-lg font-semibold tabular-nums text-foreground">
                  {stat.value}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
