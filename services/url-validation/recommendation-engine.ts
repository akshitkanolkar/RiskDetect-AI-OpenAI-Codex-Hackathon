import type { BrandMatch, UrlThreatCategory } from "./types";

export function buildRecommendation(input: {
  categories: UrlThreatCategory[];
  brandMatch: BrandMatch | null;
  isShortened: boolean;
  isIp: boolean;
  riskScore: number;
}): string {
  const { categories, brandMatch, isShortened, isIp, riskScore } = input;

  if (brandMatch && !brandMatch.isExactOfficial) {
    return `Avoid entering credentials. Use the official ${brandMatch.brand.name} website (${brandMatch.officialDomain}) instead.`;
  }

  if (categories.includes("Homoglyph Attack") || categories.includes("Typosquatting")) {
    return "Do not visit this lookalike domain. Navigate to the brand via a bookmark or official app.";
  }

  if (isShortened) {
    return "Expand the short link in a sandbox or preview tool before opening; do not enter credentials on the destination.";
  }

  if (isIp) {
    return "Avoid raw IP links from untrusted sources. Prefer the service's official domain name.";
  }

  if (riskScore >= 70) {
    return "Treat this URL as high risk: do not open it, and report it to your security team if it was unexpected.";
  }

  if (riskScore >= 40) {
    return "Verify the domain carefully before interacting; prefer typed official URLs over clicked links.";
  }

  if (brandMatch?.isExactOfficial) {
    return `Domain matches official ${brandMatch.brand.name} infrastructure, but still confirm the full path and that you intended this visit.`;
  }

  return "No elevated impersonation signals detected. Continue to verify destinations before sharing credentials.";
}
