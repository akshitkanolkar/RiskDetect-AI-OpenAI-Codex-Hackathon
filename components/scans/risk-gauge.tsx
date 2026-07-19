"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types";

const COLORS: Record<RiskLevel, string> = {
  safe: "hsl(var(--risk-safe))",
  low: "hsl(var(--risk-low))",
  medium: "hsl(var(--risk-medium))",
  high: "hsl(var(--risk-high))",
  critical: "hsl(var(--risk-critical))",
};

export function RiskGauge({
  score,
  level,
  className,
}: {
  score: number;
  level: RiskLevel;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = 70;
  const circumference = Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className={cn("relative mx-auto w-48", className)}>
      <svg viewBox="0 0 180 110" className="w-full">
        <path
          d="M20 100 A70 70 0 0 1 160 100"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <motion.path
          d="M20 100 A70 70 0 0 1 160 100"
          fill="none"
          stroke={COLORS[level]}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <p className="text-3xl font-bold tracking-tight" style={{ color: COLORS[level] }}>
          {clamped}
        </p>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{level}</p>
      </div>
    </div>
  );
}
