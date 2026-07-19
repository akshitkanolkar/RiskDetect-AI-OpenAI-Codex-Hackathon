import type { ImageFinding } from "@/types/scans";
import type { RiskLevel } from "@/types";
import { analyzeUrlIntelligence } from "./analyze";
import type { UrlIntelligenceResult } from "./types";

const RANK: Record<RiskLevel, number> = {
  safe: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

function maxRisk(a: RiskLevel, b: RiskLevel): RiskLevel {
  return RANK[a] >= RANK[b] ? a : b;
}

function buildExplanation(intel: UrlIntelligenceResult): string {
  const parts: string[] = [];

  if (intel.signals.isTyposquat || intel.signals.isBrandImpersonation) {
    const brand = intel.brandName ?? "a trusted brand";
    const visual = intel.reasons.find((r) =>
      /rn|visually|0|1|homoglyph|Cyrillic|Greek|Lookalike/i.test(r),
    );
    parts.push(
      `This URL appears to imitate ${brand}'s official domain` +
        (intel.officialDomain ? ` (${intel.officialDomain})` : "") +
        (visual ? `. ${visual}` : "") +
        ". This visual substitution is a common typosquatting technique used in phishing campaigns.",
    );
  } else if (intel.signals.hasHomoglyph) {
    parts.push(
      "Hostname contains visually deceptive characters commonly used in homoglyph phishing attacks.",
    );
  }

  if (intel.signals.suspiciousKeywords.length) {
    parts.push(
      `Suspicious login/verification terms detected (${intel.signals.suspiciousKeywords.slice(0, 4).join(", ")}), increasing credential-theft risk.`,
    );
  }

  if (intel.signals.isShortened) {
    parts.push("Shortened URL — destination cannot be verified without expansion.");
  }

  if (intel.signals.hasIpHost) {
    parts.push("Raw IP hostname is atypical for legitimate consumer services.");
  }

  if (!parts.length) {
    parts.push(
      intel.reasons[0] ??
        "URL is syntactically valid; validity alone does not imply trustworthiness.",
    );
  }

  return parts.join(" ");
}

/**
 * Enrich OCR / screenshot URL findings with the shared URL intelligence engine.
 * Preserves bounding boxes and identity; upgrades risk, reason, and recommendation.
 * Never keeps a typosquat / brand-impersonation URL at SAFE/LOW.
 */
export function enrichOcrUrlFindings(findings: ImageFinding[]): ImageFinding[] {
  return findings.map((finding) => {
    if (finding.category !== "url" && finding.category !== "qr") {
      return finding;
    }

    const candidate = finding.value;
    if (finding.category === "qr" && !/^https?:\/\//i.test(candidate)) {
      return finding;
    }

    try {
      const intel = analyzeUrlIntelligence(candidate);
      return applyIntelligenceToFinding(finding, intel);
    } catch {
      return finding;
    }
  });
}

export function applyIntelligenceToFinding(
  finding: ImageFinding,
  intel: UrlIntelligenceResult,
): ImageFinding {
  const dangerous =
    intel.signals.isTyposquat ||
    intel.signals.isBrandImpersonation ||
    (intel.signals.hasHomoglyph && intel.signals.isBrandImpersonation);

  let risk = maxRisk(finding.risk_level, intel.riskLevel);
  if (dangerous && RANK[risk] < 3) {
    risk = intel.riskScore >= 85 ? "critical" : "high";
  }

  const threats = intel.threatCategories.filter((c) => c !== "Clean");

  return {
    ...finding,
    risk_level: risk,
    confidence: Math.max(finding.confidence ?? 0, intel.confidence, dangerous ? 92 : 0),
    reason: buildExplanation(intel),
    recommendation: intel.recommendedAction || finding.recommendation,
    risk_category: threats.join(" / ") || finding.risk_category,
    validation_method: "URL Intelligence",
    label:
      intel.signals.isTyposquat || intel.signals.isBrandImpersonation
        ? `Phishing URL · ${intel.brandName ?? intel.domain}`
        : finding.label.startsWith("URL")
          ? `URL · ${intel.rootDomain || intel.domain}`
          : finding.label,
    context: intel.rootDomain || finding.context,
  };
}

/**
 * Analyze a list of raw URL strings (e.g. from OCR extractors) into intelligence results.
 */
export function analyzeOcrUrls(urls: string[]): UrlIntelligenceResult[] {
  const results: UrlIntelligenceResult[] = [];
  for (const url of urls) {
    try {
      results.push(analyzeUrlIntelligence(url));
    } catch {
      /* skip unparseable */
    }
  }
  return results;
}
