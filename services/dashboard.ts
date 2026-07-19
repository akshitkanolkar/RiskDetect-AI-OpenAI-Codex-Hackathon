import { listRiskHistory, listUserHistory } from "@/lib/db/scans";
import type { DashboardData } from "@/types/scans";
import type { RiskLevel } from "@/types";
import { scoreToRiskLevel } from "@/utils/risk";
import { format } from "date-fns";

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const [history, riskHistory] = await Promise.all([
    listUserHistory(userId, "all", 50),
    listRiskHistory(userId),
  ]);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todayScans = history.filter((s) => new Date(s.created_at) >= startOfDay).length;
  const recentThreats = history.filter((s) =>
    ["medium", "high", "critical"].includes(s.risk_level),
  ).length;

  const latestScores = history.slice(0, 10).map((s) => s.risk_score);
  const riskScore =
    latestScores.length === 0
      ? 0
      : Math.round(latestScores.reduce((a, b) => a + b, 0) / latestScores.length);
  const riskLevel = scoreToRiskLevel(riskScore);

  const byDay = new Map<string, number[]>();
  for (const point of riskHistory) {
    const key = format(new Date(point.recorded_at), "MMM d");
    const arr = byDay.get(key) ?? [];
    arr.push(point.risk_score);
    byDay.set(key, arr);
  }

  // Prefer last 7 distinct days from history if risk_history empty
  if (byDay.size === 0) {
    for (const scan of [...history].reverse()) {
      const key = format(new Date(scan.created_at), "MMM d");
      const arr = byDay.get(key) ?? [];
      arr.push(scan.risk_score);
      byDay.set(key, arr);
    }
  }

  const riskTrend = Array.from(byDay.entries())
    .slice(-7)
    .map(([date, scores]) => ({
      date,
      score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    }));

  const distributionSeed: RiskLevel[] = ["safe", "low", "medium", "high", "critical"];
  const counts = Object.fromEntries(distributionSeed.map((l) => [l, 0])) as Record<
    RiskLevel,
    number
  >;
  for (const scan of history) {
    counts[scan.risk_level] += 1;
  }
  const riskDistribution = distributionSeed
    .map((level) => ({
      name: level.charAt(0).toUpperCase() + level.slice(1),
      value: counts[level],
      level,
    }))
    .filter((d) => d.value > 0);

  const activity = history.slice(0, 8).map((scan) => ({
    id: scan.id,
    title: scan.scan_type === "url" ? `URL scan · ${scan.domain}` : `Image scan · ${scan.file_name}`,
    description:
      scan.scan_type === "url"
        ? scan.ai_explanation.slice(0, 120)
        : `${scan.findings.length} finding(s) · ${scan.risk_level}`,
    timestamp: scan.created_at,
    risk_level: scan.risk_level,
    scan_type: scan.scan_type,
  }));

  return {
    riskScore,
    riskLevel,
    todayScans,
    totalScans: history.length,
    recentThreats,
    riskTrend,
    riskDistribution,
    recentScans: history.slice(0, 6),
    activity,
  };
}
