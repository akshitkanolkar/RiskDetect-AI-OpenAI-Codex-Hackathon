import type { ParsedUrlParts, SignalContribution, BrandMatch } from "./types";
import {
  detectExcessiveSubdomains,
  detectHomoglyph,
  detectIpAddressUrl,
  detectLongOrObfuscatedUrl,
  detectShortenedUrl,
  detectSuspiciousKeywords,
  detectSuspiciousTld,
  detectTyposquatting,
  matchBrand,
} from "./detectors";
import { estimateDomainAgeDays } from "./normalizer";

export interface HeuristicEngineInput {
  parsed: ParsedUrlParts;
  listedInUrlhaus?: boolean;
  listedInOpenPhish?: boolean;
}

export interface HeuristicEngineOutput {
  brandMatch: BrandMatch | null;
  contributions: SignalContribution[];
  reasons: string[];
  keywords: string[];
  domainAgeDays: number | null;
  flags: {
    isTyposquat: boolean;
    isHomoglyph: boolean;
    isBrandImpersonation: boolean;
    hasDeepSubdomains: boolean;
    hasSuspiciousTld: boolean;
    isLongUrl: boolean;
    isShortened: boolean;
    isIpAddress: boolean;
    hasEncodedPayload: boolean;
    hasExcessiveParams: boolean;
  };
}

/**
 * Run the full heuristic detection suite and emit scored signal contributions.
 */
export function runHeuristicEngine(input: HeuristicEngineInput): HeuristicEngineOutput {
  const { parsed } = input;
  const brandMatch = matchBrand(parsed);
  const typosquat = detectTyposquatting(parsed, brandMatch);
  const homoglyph = detectHomoglyph(parsed, brandMatch);
  const keywords = detectSuspiciousKeywords(parsed, brandMatch);
  const subdomains = detectExcessiveSubdomains(parsed);
  const tld = detectSuspiciousTld(parsed, brandMatch);
  const longUrl = detectLongOrObfuscatedUrl(parsed);
  const ip = detectIpAddressUrl(parsed);
  const shortened = detectShortenedUrl(parsed);
  const domainAgeDays = estimateDomainAgeDays(parsed.rootDomain || parsed.hostname);

  const contributions: SignalContribution[] = [];
  const reasons: string[] = [];

  const push = (c: SignalContribution) => {
    contributions.push(c);
    reasons.push(c.detail);
  };

  const isBrandImpersonation =
    !!brandMatch &&
    !brandMatch.isExactOfficial &&
    (typosquat.detected || brandMatch.similarity >= 0.9);

  if (typosquat.detected) {
    // Strong lookalikes (edit distance ≤1 or near-exact visual fold) escalate harder
    const strong =
      !!brandMatch &&
      (brandMatch.distance <= 1 || brandMatch.similarity >= 0.95 || brandMatch.jaroWinkler >= 0.96);
    push({
      id: "typosquat",
      label: "Typosquatting",
      points: strong ? 45 : 35,
      category: "Typosquatting",
      detail: typosquat.reasons[0] ?? "Lookalike domain detected",
    });
    for (const r of typosquat.reasons.slice(1)) reasons.push(r);
  }

  if (isBrandImpersonation) {
    push({
      id: "brand",
      label: "Brand impersonation",
      points: typosquat.detected ? 30 : 30,
      category: "Brand Impersonation",
      detail: `Potential ${brandMatch!.brand.name} impersonation — official domain is ${brandMatch!.officialDomain}`,
    });
  }

  if (homoglyph.detected && (typosquat.detected || homoglyph.substitutions.length > 0)) {
    // Avoid double-counting weak digit noise on unrelated domains
    const relevant =
      typosquat.detected ||
      homoglyph.substitutions.some((s) => s.from.length > 1 || /[^\x00-\x7F]/.test(s.from)) ||
      homoglyph.reasons.some((r) => /Cyrillic|Greek|Punycode|homoglyph/i.test(r));
    if (relevant) {
      push({
        id: "homoglyph",
        label: "Homoglyph attack",
        points: 25,
        category: "Homoglyph Attack",
        detail: homoglyph.reasons[0] ?? "Visually deceptive characters detected",
      });
      for (const r of homoglyph.reasons.slice(1)) {
        if (!reasons.includes(r)) reasons.push(r);
      }
    }
  }

  if (keywords.keywords.length) {
    push({
      id: "keywords",
      label: "Suspicious keywords",
      points: keywords.elevated ? 15 : 8,
      category: "Suspicious Keywords",
      detail: keywords.reasons[0] ?? `Keywords: ${keywords.keywords.join(", ")}`,
    });
    for (const r of keywords.reasons.slice(1)) reasons.push(r);
  }

  if (subdomains.detected) {
    push({
      id: "subdomains",
      label: "Deep subdomains",
      points: 10,
      category: "Excessive Subdomains",
      detail: subdomains.reasons[0]!,
    });
  }

  if (tld.detected) {
    push({
      id: "tld",
      label: "Suspicious TLD",
      points: 10,
      category: "Suspicious TLD",
      detail: tld.reasons[0]!,
    });
  }

  if (longUrl.reasons.length) {
    push({
      id: "long-url",
      label: "Long / obfuscated URL",
      points: Math.min(15, 5 + longUrl.reasons.length * 3),
      category: "Long / Obfuscated URL",
      detail: longUrl.reasons[0]!,
    });
    for (const r of longUrl.reasons.slice(1)) reasons.push(r);
  }

  if (ip.detected) {
    push({
      id: "ip",
      label: "IP address URL",
      points: 25,
      category: "IP Address URL",
      detail: ip.reasons[0]!,
    });
  }

  if (shortened.detected) {
    push({
      id: "shortener",
      label: "Shortened URL",
      points: 15,
      category: "Shortened URL",
      detail: shortened.reasons[0]!,
    });
  }

  if (parsed.protocol !== "https" && parsed.protocol !== "upi" && parsed.protocol !== "otpauth") {
    push({
      id: "proto",
      label: "Insecure protocol",
      points: 18,
      category: "Insecure Protocol",
      detail: "Non-HTTPS protocol increases interception risk",
    });
  }

  if (domainAgeDays !== null && domainAgeDays < 60 && !brandMatch?.isExactOfficial) {
    push({
      id: "age",
      label: "Young domain",
      points: 20,
      category: "Young Domain",
      detail: "Domain appears newly registered",
    });
  }

  if (input.listedInUrlhaus) {
    push({
      id: "urlhaus",
      label: "URLHaus listing",
      points: 45,
      category: "Threat Feed Match",
      detail: "Domain listed in URLHaus malicious host feed",
    });
  }

  if (input.listedInOpenPhish) {
    push({
      id: "openphish",
      label: "OpenPhish listing",
      points: 45,
      category: "Threat Feed Match",
      detail: "URL matched OpenPhish phishing feed",
    });
  }

  return {
    brandMatch,
    contributions,
    reasons: reasons.length ? reasons : ["No elevated heuristic signals detected"],
    keywords: keywords.keywords,
    domainAgeDays,
    flags: {
      isTyposquat: typosquat.detected,
      isHomoglyph: homoglyph.detected && (typosquat.detected || homoglyph.substitutions.length > 0),
      isBrandImpersonation,
      hasDeepSubdomains: subdomains.detected,
      hasSuspiciousTld: tld.detected,
      isLongUrl: longUrl.isLong,
      isShortened: shortened.detected,
      isIpAddress: ip.detected,
      hasEncodedPayload: longUrl.hasEncodedPayload,
      hasExcessiveParams: longUrl.hasExcessiveParams,
    },
  };
}
