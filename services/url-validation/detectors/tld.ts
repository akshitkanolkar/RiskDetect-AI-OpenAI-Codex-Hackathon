import { SUSPICIOUS_TLDS } from "../brands";
import type { BrandMatch, ParsedUrlParts } from "../types";

/**
 * Flag uncommon TLDs when combined with brand impersonation (not alone).
 */
export function detectSuspiciousTld(
  parsed: ParsedUrlParts,
  brandMatch: BrandMatch | null,
): { detected: boolean; reasons: string[] } {
  const tld = parsed.tld.toLowerCase();
  const uncommon = SUSPICIOUS_TLDS.has(tld);
  const impersonating = !!brandMatch && !brandMatch.isExactOfficial;

  if (uncommon && impersonating) {
    return {
      detected: true,
      reasons: [
        `Uncommon TLD ".${tld}" combined with ${brandMatch!.brand.name} lookalike / impersonation`,
      ],
    };
  }

  if (uncommon && parsed.subdomains.length >= 2) {
    return {
      detected: true,
      reasons: [`Uncommon TLD ".${tld}" with nested subdomains — common in phishing kits`],
    };
  }

  return { detected: false, reasons: [] };
}
