import {
  analyzeUrlIntelligence,
  estimateDomainAgeDays as estimateAge,
  SUSPICIOUS_KEYWORDS,
} from "@/services/url-validation";

/** @deprecated Prefer analyzeUrlIntelligence — kept for callers outside the scanner. */
export function normalizeUrl(input: string): {
  normalized: string;
  protocol: string;
  domain: string;
  hostname: string;
} {
  const intel = analyzeUrlIntelligence(input);
  return {
    normalized: intel.normalizedUrl,
    protocol: intel.protocol,
    domain: intel.domain,
    hostname: intel.hostname,
  };
}

export function extractSuspiciousKeywords(url: string): string[] {
  const lower = url.toLowerCase();
  return SUSPICIOUS_KEYWORDS.filter((keyword) => lower.includes(keyword));
}

export function hasIpHostname(hostname: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.includes(":");
}

/**
 * Back-compat wrapper — delegates to the URL intelligence homoglyph / typosquat engine.
 */
export function looksLikeHomoglyph(hostname: string): boolean {
  try {
    const intel = analyzeUrlIntelligence(`https://${hostname}`);
    return intel.signals.hasHomoglyph || intel.signals.isTyposquat;
  } catch {
    return (
      /[0o]/.test(hostname) &&
      /(amaz[0o]n|g[0o]{2}gle|micr[0o]s[0o]ft|paypa[l1]|faceb[0o]{2}k)/i.test(hostname)
    );
  }
}

export function estimateDomainAgeDays(domain: string): number | null {
  return estimateAge(domain);
}
