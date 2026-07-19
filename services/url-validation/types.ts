import type { RiskLevel } from "@/types";

export type UrlThreatCategory =
  | "Typosquatting"
  | "Brand Impersonation"
  | "Homoglyph Attack"
  | "Suspicious Keywords"
  | "Excessive Subdomains"
  | "Suspicious TLD"
  | "Long / Obfuscated URL"
  | "IP Address URL"
  | "Shortened URL"
  | "Threat Feed Match"
  | "Insecure Protocol"
  | "Young Domain"
  | "Clean";

export interface ParsedUrlParts {
  raw: string;
  normalized: string;
  protocol: string;
  hostname: string;
  unicodeHostname: string;
  rootDomain: string;
  registrableLabel: string;
  subdomains: string[];
  tld: string;
  path: string;
  search: string;
  port: string;
  isIpHost: boolean;
}

export interface BrandEntry {
  name: string;
  domains: string[];
  aliases?: string[];
}

export interface BrandMatch {
  brand: BrandEntry;
  officialDomain: string;
  distance: number;
  jaroWinkler: number;
  similarity: number;
  isExactOfficial: boolean;
}

export interface HomoglyphFinding {
  detected: boolean;
  substitutions: Array<{ from: string; to: string; description: string }>;
  reasons: string[];
}

export interface TyposquatFinding {
  detected: boolean;
  brand: BrandMatch | null;
  reasons: string[];
}

export interface SignalContribution {
  id: string;
  label: string;
  points: number;
  category: UrlThreatCategory;
  detail: string;
}

export interface UrlIntelligenceSignals {
  suspiciousKeywords: string[];
  protocol: string;
  domain: string;
  rootDomain: string;
  tld: string;
  subdomains: string[];
  unicodeHostname: string;
  hasIpHost: boolean;
  hasHomoglyph: boolean;
  isTyposquat: boolean;
  isBrandImpersonation: boolean;
  hasDeepSubdomains: boolean;
  hasSuspiciousTld: boolean;
  isLongUrl: boolean;
  isShortened: boolean;
  hasEncodedPayload: boolean;
  hasExcessiveParams: boolean;
  listedInUrlhaus: boolean;
  listedInOpenPhish: boolean;
  domainAgeDays: number | null;
  heuristicScore: number;
  matchedBrand: string | null;
  officialDomain: string | null;
  levenshteinDistance: number | null;
  jaroWinklerSimilarity: number | null;
  contributions: SignalContribution[];
}

export interface UrlIntelligenceResult {
  url: string;
  normalizedUrl: string;
  domain: string;
  hostname: string;
  rootDomain: string;
  subdomains: string[];
  tld: string;
  unicodeHostname: string;
  protocol: string;
  riskScore: number;
  riskLevel: RiskLevel;
  confidence: number;
  threatCategories: UrlThreatCategory[];
  reasons: string[];
  recommendedAction: string;
  officialDomain: string | null;
  brandName: string | null;
  signals: UrlIntelligenceSignals;
  parsed: ParsedUrlParts;
}
