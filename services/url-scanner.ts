import { aiService } from "@/services/ai";
import { checkOpenPhish, checkUrlhaus } from "@/services/threat-intel";
import { createId, nowIso, saveRiskHistory, saveUrlScan } from "@/lib/db/scans";
import {
  estimateDomainAgeDays,
  extractSuspiciousKeywords,
  hasIpHostname,
  looksLikeHomoglyph,
  normalizeUrl,
} from "@/utils/url";
import type { TimelineEvent, UrlScanRecord } from "@/types/scans";
import { scoreToRiskLevel } from "@/utils/risk";

export async function scanUrl(userId: string, rawUrl: string): Promise<UrlScanRecord> {
  const { normalized, protocol, domain, hostname } = normalizeUrl(rawUrl);
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

  const suspiciousKeywords = extractSuspiciousKeywords(normalized);
  const ipHost = hasIpHostname(hostname);
  const homoglyph = looksLikeHomoglyph(hostname);
  const domainAgeDays = estimateDomainAgeDays(domain);

  push(
    "Normalized target",
    `${protocol.toUpperCase()} · ${domain}`,
    "info",
  );

  if (suspiciousKeywords.length) {
    push(
      "Suspicious keywords",
      `Matched: ${suspiciousKeywords.slice(0, 5).join(", ")}`,
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
      [
        listedInUrlhaus ? "URLHaus" : null,
        listedInOpenPhish ? "OpenPhish" : null,
      ]
        .filter(Boolean)
        .join(" + "),
      "danger",
    );
  } else {
    push("Threat intel check", "No current feed matches for this host.", "success");
  }

  if (domainAgeDays !== null && domainAgeDays < 90) {
    push("Domain age signal", `Estimated age ~${domainAgeDays} days (young).`, "warning");
  }

  const reasons: string[] = [];
  let heuristicScore = 8;

  if (protocol !== "https") {
    heuristicScore += 18;
    reasons.push("Non-HTTPS protocol increases interception risk");
  }
  if (suspiciousKeywords.length) {
    heuristicScore += Math.min(30, suspiciousKeywords.length * 8);
    reasons.push(`Suspicious keywords in URL: ${suspiciousKeywords.join(", ")}`);
  }
  if (ipHost) {
    heuristicScore += 25;
    reasons.push("Hostname is an IP address rather than a domain");
  }
  if (homoglyph) {
    heuristicScore += 35;
    reasons.push("Possible brand impersonation / homoglyph pattern");
  }
  if (domainAgeDays !== null && domainAgeDays < 60) {
    heuristicScore += 20;
    reasons.push("Domain appears newly registered");
  }
  if (listedInUrlhaus) {
    heuristicScore += 45;
    reasons.push("Domain listed in URLHaus malicious host feed");
  }
  if (listedInOpenPhish) {
    heuristicScore += 45;
    reasons.push("URL matched OpenPhish phishing feed");
  }
  if (domain.split(".").length > 4) {
    heuristicScore += 12;
    reasons.push("Unusually deep subdomain nesting");
  }

  heuristicScore = Math.min(100, heuristicScore);

  const analysis = await aiService.analyzeUrl({
    url: normalized,
    domain,
    protocol,
    heuristicScore,
    reasons,
    listed: listedInUrlhaus || listedInOpenPhish,
    signals: {
      suspiciousKeywords,
      protocol,
      domain,
      hasIpHost: ipHost,
      hasHomoglyph: homoglyph,
      listedInUrlhaus,
      listedInOpenPhish,
      domainAgeDays,
      heuristicScore,
    },
  });

  push("AI risk synthesis", analysis.ai_explanation.slice(0, 120) + "…", "info");

  const risk_score = analysis.risk_score;
  const risk_level = analysis.risk_level ?? scoreToRiskLevel(risk_score);

  const record: UrlScanRecord = {
    id: createId(),
    user_id: userId,
    url: rawUrl,
    normalized_url: normalized,
    domain,
    protocol,
    status: "completed",
    risk_level,
    risk_score,
    confidence: analysis.confidence,
    threat_category: analysis.threat_category ?? "unknown",
    reasons: reasons.length ? reasons : ["No elevated heuristic signals detected"],
    recommendations: analysis.recommendations,
    ai_explanation: analysis.ai_explanation,
    timeline,
    signals: {
      suspiciousKeywords,
      protocol,
      domain,
      hasIpHost: ipHost,
      hasHomoglyph: homoglyph,
      listedInUrlhaus,
      listedInOpenPhish,
      domainAgeDays,
      heuristicScore,
    },
    created_at: nowIso(),
    updated_at: nowIso(),
    deleted_at: null,
  };

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
