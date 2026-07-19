import type { RiskLevel } from "@/types";
import type { SignalContribution, UrlThreatCategory } from "./types";
import { scoreToRiskLevel } from "@/utils/risk";

export interface RiskScoreInput {
  contributions: SignalContribution[];
  baseScore?: number;
}

export interface RiskScoreResult {
  score: number;
  level: RiskLevel;
  confidence: number;
  categories: UrlThreatCategory[];
}

/**
 * Aggregate weighted heuristic signals into overall risk + confidence.
 */
export function scoreRisk(input: RiskScoreInput): RiskScoreResult {
  const base = input.baseScore ?? 5;
  const points = input.contributions.reduce((sum, c) => sum + c.points, 0);
  const score = Math.min(100, Math.max(0, base + points));

  const categories = Array.from(
    new Set(input.contributions.map((c) => c.category).filter((c) => c !== "Clean")),
  ) as UrlThreatCategory[];

  // Confidence rises with stronger / more agreeing signals
  const signalCount = input.contributions.length;
  const maxSingle = input.contributions.reduce((m, c) => Math.max(m, c.points), 0);
  let confidence = 55;
  confidence += Math.min(25, signalCount * 6);
  confidence += Math.min(15, Math.round(maxSingle / 3));
  if (categories.includes("Typosquatting") || categories.includes("Brand Impersonation")) {
    confidence += 8;
  }
  if (categories.includes("Homoglyph Attack")) confidence += 5;
  if (score < 15) confidence = Math.max(confidence, 70);
  confidence = Math.min(99, Math.max(40, confidence));

  return {
    score,
    level: scoreToRiskLevel(score),
    confidence,
    categories: categories.length ? categories : ["Clean"],
  };
}
