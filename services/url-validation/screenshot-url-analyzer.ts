import { randomUUID } from "crypto";
import type { ImageFinding } from "@/types/scans";
import type { RiskLevel } from "@/types";
import { analyzeUrlIntelligence } from "./analyze";
import { extractUrlsFromOcrText, prepareOcrTextForDetection } from "./url-extractor";
import { urlReputationService } from "./reputation";
import type { UrlIntelligenceResult } from "./types";
import { scoreToRiskLevel } from "@/utils/risk";

const RANK: Record<RiskLevel, number> = {
  safe: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

function maxLevel(a: RiskLevel, b: RiskLevel): RiskLevel {
  return RANK[a] >= RANK[b] ? a : b;
}

function buildExplanation(intel: UrlIntelligenceResult): string {
  const parts: string[] = [];

  if (intel.signals.isTyposquat || intel.signals.isBrandImpersonation) {
    const brand = intel.brandName ?? "a trusted brand";
    const visual = intel.reasons.find((r) => /rn|visually|0|1|homoglyph|Cyrillic|Greek/i.test(r));
    parts.push(
      `This URL appears to imitate ${brand}'s official domain` +
        (intel.officialDomain ? ` (${intel.officialDomain})` : "") +
        (visual ? ` — ${visual}` : "") +
        ". This visual substitution is a common typosquatting technique used in phishing campaigns.",
    );
  } else if (intel.signals.hasHomoglyph) {
    parts.push(
      "Hostname contains visually deceptive characters commonly used in homoglyph phishing attacks.",
    );
  }

  if (intel.signals.suspiciousKeywords.length) {
    parts.push(
      `The URL path/host contains suspicious terms (${intel.signals.suspiciousKeywords.slice(0, 4).join(", ")}), increasing the likelihood of credential theft.`,
    );
  }

  if (intel.signals.isShortened) {
    parts.push(
      "This is a shortened URL — the final destination cannot be verified without expansion.",
    );
  }

  if (intel.signals.hasIpHost) {
    parts.push(
      "The link uses a raw IP address instead of a domain name, which is atypical for legitimate services.",
    );
  }

  if (!parts.length) {
    if (intel.brandName && intel.signals.matchedBrand && !intel.signals.isBrandImpersonation) {
      parts.push(
        `Domain resolves to known ${intel.brandName} infrastructure. Still verify you intended this destination.`,
      );
    } else {
      parts.push(
        intel.reasons[0] ??
          "URL syntax is valid; no strong impersonation signals were detected. Validity alone does not imply trustworthiness.",
      );
    }
  }

  return parts.join(" ");
}

function toUrlFinding(intel: UrlIntelligenceResult, start?: number, end?: number): ImageFinding {
  const threats = intel.threatCategories.filter((c) => c !== "Clean");
  const isDangerous =
    intel.signals.isTyposquat ||
    intel.signals.isBrandImpersonation ||
    intel.signals.hasHomoglyph ||
    RANK[intel.riskLevel] >= 3;

  // Never label phishing lookalikes as safe merely because the URL parses
  let risk = intel.riskLevel;
  if (isDangerous && RANK[risk] < 3) {
    risk = intel.riskScore >= 70 ? "critical" : "high";
  }

  return {
    id: randomUUID(),
    category: "url",
    label:
      intel.signals.isTyposquat || intel.signals.isBrandImpersonation
        ? `Phishing URL · ${intel.brandName ?? intel.domain}`
        : intel.signals.isShortened
          ? "Shortened URL"
          : `URL · ${intel.rootDomain || intel.domain}`,
    value: intel.normalizedUrl,
    risk_level: risk,
    reason: buildExplanation(intel),
    recommendation: intel.recommendedAction,
    confidence: Math.max(intel.confidence, isDangerous ? 92 : intel.confidence),
    validation_method: "URL Intelligence",
    risk_category: threats.join(" / ") || "Network",
    ocr_source: "tesseract",
    context: intel.rootDomain,
    start,
    end,
  };
}

export interface ScreenshotUrlAnalysis {
  /** Healed OCR text for downstream extractors. */
  healedText: string;
  /** URL findings with intelligence applied. */
  urlFindings: ImageFinding[];
  /** Max risk among URL findings. */
  maxUrlRisk: RiskLevel;
  /** Suggested floor for overall image risk score. */
  riskFloor: number;
}

/**
 * Screenshot URL analyzer — extract every OCR URL, run full intelligence, emit findings.
 */
export async function analyzeScreenshotUrls(ocrText: string): Promise<ScreenshotUrlAnalysis> {
  const healedText = prepareOcrTextForDetection(ocrText);
  const extracted = extractUrlsFromOcrText(healedText);
  const urlFindings: ImageFinding[] = [];

  for (const item of extracted) {
    try {
      let intel = analyzeUrlIntelligence(item.normalized);

      // Optional reputation layer (no-op until providers are registered)
      try {
        const rep = await urlReputationService.lookup(intel.normalizedUrl, intel.domain);
        if (rep.anyListed) {
          intel = analyzeUrlIntelligence(item.normalized, {
            listedInOpenPhish: rep.signals.some((s) => s.provider === "openphish" && s.listed),
            listedInUrlhaus: rep.signals.some((s) => s.provider === "urlhaus" && s.listed),
          });
        }
      } catch {
        /* reputation optional */
      }

      urlFindings.push(toUrlFinding(intel, item.start, item.end));
    } catch {
      /* skip unparseable */
    }
  }

  const maxUrlRisk = urlFindings.reduce<RiskLevel>((max, f) => maxLevel(max, f.risk_level), "safe");

  const riskFloor =
    maxUrlRisk === "critical"
      ? 90
      : maxUrlRisk === "high"
        ? 75
        : maxUrlRisk === "medium"
          ? 45
          : maxUrlRisk === "low"
            ? 20
            : 0;

  return { healedText, urlFindings, maxUrlRisk, riskFloor };
}

/**
 * Merge pipeline findings with screenshot URL intelligence findings.
 * URL intel findings win on same normalized URL value.
 */
export function mergeUrlFindings(
  pipelineFindings: ImageFinding[],
  urlFindings: ImageFinding[],
): ImageFinding[] {
  const byKey = new Map<string, ImageFinding>();

  const keyOf = (v: string) => v.toLowerCase().replace(/\/$/, "");

  for (const f of pipelineFindings) {
    if (f.category !== "url") {
      byKey.set(`${f.category}:${keyOf(f.value)}`, f);
      continue;
    }
    byKey.set(`url:${keyOf(f.value)}`, f);
  }

  for (const f of urlFindings) {
    const k = `url:${keyOf(f.value)}`;
    const existing = byKey.get(k);
    if (!existing) {
      byKey.set(k, f);
      continue;
    }
    // Prefer higher risk + richer intelligence explanation
    byKey.set(k, {
      ...existing,
      ...f,
      id: existing.id,
      bbox: existing.bbox ?? f.bbox,
      start: existing.start ?? f.start,
      end: existing.end ?? f.end,
      risk_level: maxLevel(existing.risk_level, f.risk_level),
      confidence: Math.max(existing.confidence ?? 0, f.confidence ?? 0),
    });
  }

  return Array.from(byKey.values());
}

/** Floor overall image score so AI cannot mark phishing screenshots as SAFE. */
export function applyUrlRiskFloor(
  heuristicScore: number,
  aiScore: number,
  riskFloor: number,
): { risk_score: number; risk_level: RiskLevel } {
  const risk_score = Math.max(heuristicScore, aiScore, riskFloor);
  return { risk_score, risk_level: scoreToRiskLevel(risk_score) };
}
