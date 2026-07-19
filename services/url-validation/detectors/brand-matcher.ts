import { TRUSTED_BRANDS } from "../brands";
import type { BrandEntry, BrandMatch, ParsedUrlParts } from "../types";
import { levenshtein } from "../utils/levenshtein";
import { damerauLevenshtein } from "../utils/damerau-levenshtein";
import { jaroWinkler } from "../utils/jaro-winkler";
import { foldVisualConfusables, generateSubstitutionVariants } from "../utils/visual-similarity";

function brandLabel(domain: string): string {
  const parts = domain.toLowerCase().split(".");
  // Prefer leftmost label of registrable domain (e.g. microsoft from microsoft.com)
  return parts[0] ?? domain;
}

function isOfficialHost(hostname: string, brand: BrandEntry): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  return brand.domains.some((d) => {
    const official = d.toLowerCase();
    return host === official || host.endsWith(`.${official}`);
  });
}

function scoreAgainstLabel(
  candidate: string,
  officialLabel: string,
): {
  distance: number;
  jaroWinkler: number;
  similarity: number;
} {
  const variants = generateSubstitutionVariants(candidate);
  let bestDistance = Infinity;
  let bestJw = 0;

  for (const v of variants) {
    const d = Math.min(levenshtein(v, officialLabel), damerauLevenshtein(v, officialLabel));
    const jw = jaroWinkler(v, officialLabel);
    if (d < bestDistance || (d === bestDistance && jw > bestJw)) {
      bestDistance = d;
      bestJw = jw;
    }
  }

  // Also compare folded form directly
  const folded = foldVisualConfusables(candidate);
  bestDistance = Math.min(
    bestDistance,
    levenshtein(folded, officialLabel),
    damerauLevenshtein(folded, officialLabel),
  );
  bestJw = Math.max(bestJw, jaroWinkler(folded, officialLabel));

  const maxLen = Math.max(candidate.length, officialLabel.length, 1);
  const similarity = Math.max(1 - bestDistance / maxLen, bestJw);

  return { distance: bestDistance, jaroWinkler: bestJw, similarity };
}

/**
 * Find the closest trusted brand for a parsed host.
 * Exact official hosts return isExactOfficial=true (not an impersonation).
 */
export function matchBrand(
  parsed: ParsedUrlParts,
  brands: BrandEntry[] = TRUSTED_BRANDS,
): BrandMatch | null {
  const host = parsed.hostname.replace(/^www\./, "");

  for (const brand of brands) {
    if (isOfficialHost(host, brand)) {
      const officialDomain = brand.domains[0]!;
      return {
        brand,
        officialDomain,
        distance: 0,
        jaroWinkler: 1,
        similarity: 1,
        isExactOfficial: true,
      };
    }
  }

  let best: BrandMatch | null = null;
  const candidates = [
    parsed.registrableLabel,
    foldVisualConfusables(parsed.registrableLabel),
    ...parsed.subdomains,
  ];

  for (const brand of brands) {
    for (const official of brand.domains) {
      const label = brandLabel(official);
      if (label.length < 4) continue;

      for (const candidate of candidates) {
        if (!candidate || candidate.length < 3) continue;
        // Skip when candidate is a generic word far from brand
        const scored = scoreAgainstLabel(candidate, label);
        const lengthDelta = Math.abs(candidate.length - label.length);
        const close =
          (scored.distance <= 2 && scored.jaroWinkler >= 0.88) ||
          (scored.distance <= 3 && scored.jaroWinkler >= 0.92 && lengthDelta <= 2) ||
          scored.similarity >= 0.9;

        if (!close) continue;
        if (candidate === label && isOfficialHost(host, brand)) continue;

        const match: BrandMatch = {
          brand,
          officialDomain: official,
          distance: scored.distance,
          jaroWinkler: scored.jaroWinkler,
          similarity: scored.similarity,
          isExactOfficial: false,
        };

        if (!best || match.similarity > best.similarity) {
          best = match;
        }
      }
    }

    // Brand name / alias embedded in subdomain of a different root
    for (const alias of [brand.name.toLowerCase(), ...(brand.aliases ?? [])]) {
      const aliasCompact = alias.replace(/\s+/g, "");
      if (aliasCompact.length < 4) continue;
      const inSub = parsed.subdomains.some(
        (s) => s.includes(aliasCompact) || foldVisualConfusables(s).includes(aliasCompact),
      );
      const inLabel =
        parsed.registrableLabel.includes(aliasCompact) ||
        foldVisualConfusables(parsed.registrableLabel).includes(aliasCompact);
      if ((inSub || inLabel) && !isOfficialHost(host, brand)) {
        const match: BrandMatch = {
          brand,
          officialDomain: brand.domains[0]!,
          distance: 1,
          jaroWinkler: 0.95,
          similarity: 0.95,
          isExactOfficial: false,
        };
        if (!best || match.similarity > best.similarity) best = match;
      }
    }
  }

  return best;
}

export function isOfficialBrandDomain(
  hostname: string,
  brands: BrandEntry[] = TRUSTED_BRANDS,
): BrandEntry | null {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  return brands.find((b) => isOfficialHost(host, b)) ?? null;
}
