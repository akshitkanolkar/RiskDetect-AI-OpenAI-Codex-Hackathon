import type { BrandMatch, HomoglyphFinding, ParsedUrlParts } from "../types";
import {
  describeSubstitutions,
  foldVisualConfusables,
  HOMOGLYPH_MAP,
} from "../utils/visual-similarity";

const CONFUSABLE_RE = new RegExp(
  `[${Object.keys(HOMOGLYPH_MAP)
    .map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("")}]`,
  "u",
);

/**
 * Detect homoglyph / visual-confusable attacks in a hostname.
 */
export function detectHomoglyph(
  parsed: ParsedUrlParts,
  brandMatch: BrandMatch | null,
): HomoglyphFinding {
  const reasons: string[] = [];
  const substitutions: HomoglyphFinding["substitutions"] = [];
  const host = parsed.unicodeHostname || parsed.hostname;
  const label = parsed.registrableLabel;

  if (CONFUSABLE_RE.test(host)) {
    reasons.push("Non-ASCII lookalike (homoglyph) characters present in hostname");
    for (const ch of host) {
      const mapped = HOMOGLYPH_MAP[ch];
      if (mapped) {
        substitutions.push({
          from: ch,
          to: mapped,
          description: `Unicode '${ch}' maps to Latin '${mapped}'`,
        });
      }
    }
  }

  if (host !== parsed.hostname && /xn--/i.test(parsed.hostname)) {
    reasons.push(
      `Punycode hostname decodes to "${parsed.unicodeHostname}" — verify characters carefully`,
    );
  }

  if (brandMatch && !brandMatch.isExactOfficial) {
    const brandLabel = brandMatch.officialDomain.split(".")[0]!;
    const described = describeSubstitutions(label, brandLabel);
    for (const d of described) {
      if (!reasons.includes(d)) reasons.push(d);
    }
    if (/rn/.test(label) && brandLabel.includes("m")) {
      substitutions.push({ from: "rn", to: "m", description: '"rn" visually replaces "m"' });
    }
    if (/0/.test(label) && /o/.test(brandLabel)) {
      substitutions.push({ from: "0", to: "o", description: '"0" visually replaces "o"' });
    }
    if (/1/.test(label) && /[li]/.test(brandLabel)) {
      substitutions.push({ from: "1", to: "l/i", description: '"1" visually replaces "l"/"i"' });
    }
  }

  // paypaI / goog1e style ASCII confusables even without brand match
  const folded = foldVisualConfusables(label);
  if (folded !== label && /[01@3457]/.test(label)) {
    reasons.push("Digit or symbol substitutions create a visually deceptive label");
  }

  const detected = reasons.length > 0 || substitutions.length > 0;
  return { detected, substitutions, reasons };
}
