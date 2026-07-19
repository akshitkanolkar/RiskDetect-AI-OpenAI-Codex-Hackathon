import { SUSPICIOUS_KEYWORDS } from "../brands";
import type { BrandMatch, ParsedUrlParts } from "../types";

export function detectSuspiciousKeywords(
  parsed: ParsedUrlParts,
  brandMatch: BrandMatch | null,
): { keywords: string[]; reasons: string[]; elevated: boolean } {
  const haystack = `${parsed.hostname}${parsed.path}${parsed.search}`.toLowerCase();
  const keywords = SUSPICIOUS_KEYWORDS.filter((kw) => haystack.includes(kw));

  const reasons: string[] = [];
  if (keywords.length) {
    reasons.push(`Contains suspicious keywords: ${keywords.slice(0, 8).join(", ")}`);
  }

  // Elevate when keywords combine with brand impersonation or brand name in path
  const brandTokens =
    brandMatch && !brandMatch.isExactOfficial
      ? [brandMatch.brand.name.toLowerCase(), ...(brandMatch.brand.aliases ?? [])]
      : [];
  const brandInUrl = brandTokens.some(
    (t) => t.length > 3 && haystack.includes(t.replace(/\s+/g, "")),
  );
  const elevated =
    keywords.length > 0 &&
    ((!!brandMatch && !brandMatch.isExactOfficial) || brandInUrl || keywords.length >= 2);

  if (elevated && brandMatch && !brandMatch.isExactOfficial) {
    reasons.push(
      `Suspicious keywords combined with ${brandMatch.brand.name} brand impersonation signals`,
    );
  }

  return { keywords: [...keywords], reasons, elevated };
}
