import { parseUrl } from "./parser";
import { normalizeDomain } from "./normalizer";
import { runHeuristicEngine } from "./heuristic-engine";
import { scoreRisk } from "./risk-scorer";
import { buildRecommendation } from "./recommendation-engine";
import type { UrlIntelligenceResult } from "./types";

export interface AnalyzeUrlOptions {
  listedInUrlhaus?: boolean;
  listedInOpenPhish?: boolean;
}

/**
 * Shared URL intelligence entry point — normalize → parse → detect → score → recommend.
 */
export function analyzeUrlIntelligence(
  rawUrl: string,
  options: AnalyzeUrlOptions = {},
): UrlIntelligenceResult {
  const parsed = parseUrl(rawUrl);
  const normalized = normalizeDomain(parsed);
  const heuristics = runHeuristicEngine({
    parsed,
    listedInUrlhaus: options.listedInUrlhaus,
    listedInOpenPhish: options.listedInOpenPhish,
  });
  const scored = scoreRisk({ contributions: heuristics.contributions });

  const officialDomain =
    heuristics.brandMatch && !heuristics.brandMatch.isExactOfficial
      ? heuristics.brandMatch.officialDomain
      : heuristics.brandMatch?.isExactOfficial
        ? heuristics.brandMatch.officialDomain
        : null;

  const brandName = heuristics.brandMatch?.brand.name ?? null;

  // Official brand domains should not inherit lookalike scoring noise
  let riskScore = scored.score;
  let riskLevel = scored.level;
  let confidence = scored.confidence;
  let categories = scored.categories;
  let reasons = heuristics.reasons;

  if (
    heuristics.brandMatch?.isExactOfficial &&
    !options.listedInUrlhaus &&
    !options.listedInOpenPhish
  ) {
    // Keep protocol / keyword soft signals only
    const soft = heuristics.contributions.filter(
      (c) =>
        c.id === "proto" ||
        c.id === "keywords" ||
        c.id === "long-url" ||
        c.id === "urlhaus" ||
        c.id === "openphish",
    );
    const rescore = scoreRisk({ contributions: soft, baseScore: 3 });
    riskScore = rescore.score;
    riskLevel = rescore.level;
    confidence = Math.max(rescore.confidence, 85);
    categories = rescore.categories;
    reasons =
      soft.length > 0
        ? soft.map((c) => c.detail)
        : [`Official ${heuristics.brandMatch.brand.name} domain — no impersonation signals`];
  }

  const recommendedAction = buildRecommendation({
    categories,
    brandMatch: heuristics.brandMatch,
    isShortened: heuristics.flags.isShortened,
    isIp: heuristics.flags.isIpAddress,
    riskScore,
  });

  return {
    url: rawUrl,
    normalizedUrl: parsed.normalized,
    domain: normalized.domain,
    hostname: parsed.hostname,
    rootDomain: normalized.rootDomain,
    subdomains: parsed.subdomains,
    tld: parsed.tld,
    unicodeHostname: normalized.unicodeHostname,
    protocol: parsed.protocol,
    riskScore,
    riskLevel,
    confidence,
    threatCategories: categories,
    reasons,
    recommendedAction,
    officialDomain,
    brandName,
    parsed,
    signals: {
      suspiciousKeywords: heuristics.keywords,
      protocol: parsed.protocol,
      domain: normalized.domain,
      rootDomain: normalized.rootDomain,
      tld: parsed.tld,
      subdomains: parsed.subdomains,
      unicodeHostname: normalized.unicodeHostname,
      hasIpHost: heuristics.flags.isIpAddress,
      hasHomoglyph: heuristics.flags.isHomoglyph,
      isTyposquat: heuristics.flags.isTyposquat,
      isBrandImpersonation: heuristics.flags.isBrandImpersonation,
      hasDeepSubdomains: heuristics.flags.hasDeepSubdomains,
      hasSuspiciousTld: heuristics.flags.hasSuspiciousTld,
      isLongUrl: heuristics.flags.isLongUrl,
      isShortened: heuristics.flags.isShortened,
      hasEncodedPayload: heuristics.flags.hasEncodedPayload,
      hasExcessiveParams: heuristics.flags.hasExcessiveParams,
      listedInUrlhaus: !!options.listedInUrlhaus,
      listedInOpenPhish: !!options.listedInOpenPhish,
      domainAgeDays: heuristics.domainAgeDays,
      heuristicScore: riskScore,
      matchedBrand: brandName,
      officialDomain,
      levenshteinDistance: heuristics.brandMatch?.isExactOfficial
        ? 0
        : (heuristics.brandMatch?.distance ?? null),
      jaroWinklerSimilarity: heuristics.brandMatch?.jaroWinkler ?? null,
      contributions: heuristics.contributions,
    },
  };
}
