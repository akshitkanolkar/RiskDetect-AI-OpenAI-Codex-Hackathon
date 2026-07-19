import type { BrandMatch, ParsedUrlParts, TyposquatFinding } from "../types";
import { describeSubstitutions } from "../utils/visual-similarity";

/**
 * Typosquatting detector — lookalike registrable labels vs trusted brands.
 */
export function detectTyposquatting(
  parsed: ParsedUrlParts,
  brandMatch: BrandMatch | null,
): TyposquatFinding {
  if (!brandMatch || brandMatch.isExactOfficial) {
    return { detected: false, brand: brandMatch, reasons: [] };
  }

  const reasons: string[] = [];
  const brandLabel = brandMatch.officialDomain.split(".")[0]!;
  const candidate = parsed.registrableLabel;

  reasons.push(
    `Lookalike domain detected: "${candidate}" ≈ "${brandLabel}" (distance ${brandMatch.distance}, Jaro–Winkler ${(brandMatch.jaroWinkler * 100).toFixed(0)}%)`,
  );
  reasons.push(`Attempts to imitate ${brandMatch.brand.name}`);

  for (const d of describeSubstitutions(candidate, brandLabel)) {
    reasons.push(d);
  }

  // Subdomain brand bait on unrelated root
  if (
    parsed.subdomains.some(
      (s) => s.includes(brandLabel) || s.includes(brandMatch.brand.name.toLowerCase()),
    ) &&
    !brandMatch.isExactOfficial
  ) {
    reasons.push(`Brand name appears in subdomain of unrelated root "${parsed.rootDomain}"`);
  }

  return { detected: true, brand: brandMatch, reasons };
}
