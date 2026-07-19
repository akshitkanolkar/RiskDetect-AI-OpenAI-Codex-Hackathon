import type { ParsedUrlParts } from "./types";

/**
 * Domain normalizer — strips www, lowercases, exposes unicode + ASCII forms.
 */
export function normalizeDomain(parsed: ParsedUrlParts): {
  domain: string;
  rootDomain: string;
  unicodeHostname: string;
  asciiHostname: string;
} {
  return {
    domain: parsed.hostname.replace(/^www\./, ""),
    rootDomain: parsed.rootDomain.replace(/^www\./, ""),
    unicodeHostname: parsed.unicodeHostname.replace(/^www\./, ""),
    asciiHostname: parsed.hostname.replace(/^www\./, ""),
  };
}

/**
 * Heuristic stand-in when WHOIS is unavailable.
 */
export function estimateDomainAgeDays(domain: string): number | null {
  if (/\d{2,}/.test(domain) || domain.split(".").some((p) => p.length <= 3 && /\d/.test(p))) {
    return 14;
  }
  if (/\.(xyz|top|icu|click|shop|online|site)$/i.test(domain)) {
    return 45;
  }
  if (/\.(com|org|net|edu|gov)$/i.test(domain)) {
    return 1200;
  }
  return 180;
}
