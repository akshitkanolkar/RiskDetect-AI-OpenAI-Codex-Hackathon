import { aiService } from "@/services/ai";
import { checkOpenPhish, checkUrlhaus } from "@/services/threat-intel";
import { createId, nowIso, saveRiskHistory, saveUrlScan } from "@/lib/db/scans";
import { analyzeUrlIntelligence } from "@/services/url-validation";
import type { TimelineEvent, UrlScanRecord } from "@/types/scans";
import { scoreToRiskLevel } from "@/utils/risk";

export async function scanUrl(userId: string, rawUrl: string): Promise<UrlScanRecord> {
  const timeline: TimelineEvent[] = [];
  const push = (label: string, detail: string, status: TimelineEvent["status"]) => {
    timeline.push({
      id: createId(),
      label,
      detail,
      status,
      at: nowIso(),
    });
  };

  push("Validated URL", "Syntax and hostname structure look parseable.", "success");

  // Preliminary parse for threat-intel lookups (feeds need domain / normalized URL)
  const preliminary = analyzeUrlIntelligence(rawUrl);
  const normalized = preliminary.normalizedUrl;
  const protocol = preliminary.protocol;
  const domain = preliminary.domain;

  push("Normalized target", `${protocol.toUpperCase()} · ${domain}`, "info");
  push(
    "URL intelligence",
    `Parsed root=${preliminary.rootDomain}, TLD=.${preliminary.tld || "n/a"}, subdomains=${preliminary.subdomains.length}`,
    "info",
  );

  if (preliminary.signals.suspiciousKeywords.length) {
    push(
      "Suspicious keywords",
      `Matched: ${preliminary.signals.suspiciousKeywords.slice(0, 5).join(", ")}`,
      "warning",
    );
  }

  const [listedInUrlhaus, listedInOpenPhish] = await Promise.all([
    checkUrlhaus(domain),
    checkOpenPhish(normalized),
  ]);

  if (listedInUrlhaus || listedInOpenPhish) {
    push(
      "Threat intel match",
      [listedInUrlhaus ? "URLHaus" : null, listedInOpenPhish ? "OpenPhish" : null]
        .filter(Boolean)
        .join(" + "),
      "danger",
    );
  } else {
    push("Threat intel check", "No current feed matches for this host.", "success");
  }

  // Re-run with feed results so risk score includes blocklist hits
  const intel = analyzeUrlIntelligence(rawUrl, { listedInUrlhaus, listedInOpenPhish });

  if (intel.signals.isTyposquat || intel.signals.isBrandImpersonation) {
    push(
      "Brand / typosquat",
      intel.brandName
        ? `Possible ${intel.brandName} impersonation (official: ${intel.officialDomain})`
        : "Lookalike domain heuristics matched",
      "danger",
    );
  }
  if (intel.signals.hasHomoglyph) {
    push("Homoglyph analysis", "Visually deceptive characters detected in hostname.", "warning");
  }
  if (intel.signals.domainAgeDays !== null && intel.signals.domainAgeDays < 90) {
    push(
      "Domain age signal",
      `Estimated age ~${intel.signals.domainAgeDays} days (young).`,
      "warning",
    );
  }

  const reasons = intel.reasons;
  const heuristicScore = intel.riskScore;

  const analysis = await aiService.analyzeUrl({
    url: normalized,
    domain,
    protocol,
    heuristicScore,
    reasons,
    listed: listedInUrlhaus || listedInOpenPhish,
    signals: {
      suspiciousKeywords: intel.signals.suspiciousKeywords,
      protocol,
      domain,
      hasIpHost: intel.signals.hasIpHost,
      hasHomoglyph: intel.signals.hasHomoglyph,
      isTyposquat: intel.signals.isTyposquat,
      isBrandImpersonation: intel.signals.isBrandImpersonation,
      isShortened: intel.signals.isShortened,
      matchedBrand: intel.signals.matchedBrand,
      officialDomain: intel.signals.officialDomain,
      listedInUrlhaus,
      listedInOpenPhish,
      domainAgeDays: intel.signals.domainAgeDays,
      heuristicScore,
      contributions: intel.signals.contributions,
    },
  });

  push("AI risk synthesis", analysis.ai_explanation.slice(0, 120) + "…", "info");

  // Prefer the higher of heuristic vs AI when lookalike signals are strong
  let risk_score = analysis.risk_score;
  if (
    (intel.signals.isTyposquat || intel.signals.isBrandImpersonation) &&
    heuristicScore > risk_score
  ) {
    risk_score = heuristicScore;
  }
  const risk_level = scoreToRiskLevel(risk_score);
  const confidence = Math.max(analysis.confidence, intel.confidence);
  const threat_category =
    intel.threatCategories.filter((c) => c !== "Clean").join(" / ") ||
    analysis.threat_category ||
    "unknown";

  // Ensure recommendation mentions official domain when relevant
  let recommendations = analysis.recommendations;
  if (
    intel.officialDomain &&
    intel.brandName &&
    (intel.signals.isTyposquat || intel.signals.isBrandImpersonation)
  ) {
    const hasOfficial = recommendations.some((r) =>
      r.description.toLowerCase().includes(intel.officialDomain!.toLowerCase()),
    );
    if (!hasOfficial) {
      recommendations = [
        {
          id: "official-domain",
          title: `Use official ${intel.brandName} site`,
          description: intel.recommendedAction,
          priority: "immediate" as const,
        },
        ...recommendations,
      ];
    }
  }

  const record: UrlScanRecord = {
    id: createId(),
    user_id: userId,
    url: rawUrl,
    normalized_url: normalized,
    domain,
    protocol,
    status: "completed",
    risk_level: analysis.risk_level ?? risk_level,
    risk_score,
    confidence,
    threat_category,
    reasons: reasons.length ? reasons : ["No elevated heuristic signals detected"],
    recommendations,
    ai_explanation: analysis.ai_explanation,
    timeline,
    signals: {
      suspiciousKeywords: intel.signals.suspiciousKeywords,
      protocol,
      domain,
      hasIpHost: intel.signals.hasIpHost,
      hasHomoglyph: intel.signals.hasHomoglyph,
      isTyposquat: intel.signals.isTyposquat,
      isBrandImpersonation: intel.signals.isBrandImpersonation,
      hasDeepSubdomains: intel.signals.hasDeepSubdomains,
      hasSuspiciousTld: intel.signals.hasSuspiciousTld,
      isLongUrl: intel.signals.isLongUrl,
      isShortened: intel.signals.isShortened,
      matchedBrand: intel.signals.matchedBrand,
      officialDomain: intel.signals.officialDomain,
      listedInUrlhaus,
      listedInOpenPhish,
      domainAgeDays: intel.signals.domainAgeDays,
      heuristicScore,
      rootDomain: intel.rootDomain,
      tld: intel.tld,
      unicodeHostname: intel.unicodeHostname,
      recommendedAction: intel.recommendedAction,
      threatCategories: intel.threatCategories,
    },
    created_at: nowIso(),
    updated_at: nowIso(),
    deleted_at: null,
  };

  // Fix risk_level to match possibly elevated score
  record.risk_level = scoreToRiskLevel(record.risk_score);

  const saved = await saveUrlScan(record);
  await saveRiskHistory({
    user_id: userId,
    scan_id: saved.id,
    scan_type: "url",
    risk_level: saved.risk_level,
    risk_score: saved.risk_score,
    recorded_at: nowIso(),
  });

  return saved;
}
