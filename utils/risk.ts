import type { RiskLevel } from "@/types";

const RISK_LABELS: Record<RiskLevel, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  safe: "Safe",
};

const RISK_CLASS_MAP: Record<RiskLevel, string> = {
  critical: "risk-critical",
  high: "risk-high",
  medium: "risk-medium",
  low: "risk-low",
  safe: "risk-safe",
};

export function getRiskLabel(level: RiskLevel): string {
  return RISK_LABELS[level];
}

export function getRiskClassName(level: RiskLevel): string {
  return RISK_CLASS_MAP[level];
}

export function scoreToRiskLevel(score: number): RiskLevel {
  if (score >= 90) return "critical";
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  if (score >= 15) return "low";
  return "safe";
}
