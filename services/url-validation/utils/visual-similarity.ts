/**
 * Visual / character-substitution helpers for lookalike domains.
 */

/** Common Latin lookalike substitutions used in phishing. */
export const CHAR_SUBSTITUTIONS: Array<{ from: RegExp; to: string; description: string }> = [
  { from: /0/g, to: "o", description: '"0" visually replaces "o"' },
  { from: /1/g, to: "l", description: '"1" visually replaces "l"' },
  { from: /1/g, to: "i", description: '"1" visually replaces "i"' },
  { from: /3/g, to: "e", description: '"3" visually replaces "e"' },
  { from: /4/g, to: "a", description: '"4" visually replaces "a"' },
  { from: /5/g, to: "s", description: '"5" visually replaces "s"' },
  { from: /7/g, to: "t", description: '"7" visually replaces "t"' },
  { from: /@/g, to: "a", description: '"@" visually replaces "a"' },
];

/** Multi-character visual confusables. */
export const MULTI_CHAR_CONFUSABLES: Array<{
  pattern: RegExp;
  replacement: string;
  description: string;
}> = [
  { pattern: /rn/g, replacement: "m", description: '"rn" visually replaces "m"' },
  { pattern: /vv/g, replacement: "w", description: '"vv" visually replaces "w"' },
  { pattern: /cl/g, replacement: "d", description: '"cl" may visually resemble "d"' },
];

/** Homoglyph code points (Latin / Greek / Cyrillic confusables). */
export const HOMOGLYPH_MAP: Record<string, string> = {
  // Cyrillic
  а: "a",
  е: "e",
  о: "o",
  р: "p",
  с: "c",
  у: "y",
  х: "x",
  і: "i",
  ј: "j",
  ѕ: "s",
  һ: "h",
  // Greek
  α: "a",
  ο: "o",
  ν: "v",
  ρ: "p",
  τ: "t",
  υ: "u",
  χ: "x",
  ι: "i",
  η: "n",
  // Latin lookalikes / fullwidth (quoted keys for non-identifier chars)
  ı: "i",
  ｌ: "l",
  "０": "0",
  Ｏ: "o",
  ℓ: "l",
};

/**
 * Fold visually confusable characters toward ASCII for comparison.
 */
export function foldVisualConfusables(input: string): string {
  let out = "";
  for (const ch of input.toLowerCase()) {
    out += HOMOGLYPH_MAP[ch] ?? ch;
  }
  // Apply multi-char collapses after single-char map
  out = out.replace(/rn/g, "m").replace(/vv/g, "w");
  return out;
}

/**
 * Generate a small set of ASCII-normalized variants via digit/letter swaps.
 */
export function generateSubstitutionVariants(label: string, limit = 24): string[] {
  const variants = new Set<string>([label.toLowerCase()]);
  const base = label.toLowerCase();

  for (const rule of CHAR_SUBSTITUTIONS) {
    if (rule.from.test(base)) {
      variants.add(base.replace(rule.from, rule.to));
    }
    rule.from.lastIndex = 0;
  }

  for (const rule of MULTI_CHAR_CONFUSABLES) {
    if (rule.pattern.test(base)) {
      variants.add(base.replace(rule.pattern, rule.replacement));
    }
    rule.pattern.lastIndex = 0;
  }

  variants.add(foldVisualConfusables(base));
  return Array.from(variants).slice(0, limit);
}

/**
 * Describe which substitutions likely turned `candidate` into a brand lookalike.
 */
export function describeSubstitutions(candidate: string, brandLabel: string): string[] {
  const reasons: string[] = [];
  const lower = candidate.toLowerCase();
  const folded = foldVisualConfusables(lower);

  if (/rn/.test(lower) && brandLabel.includes("m") && !lower.includes(brandLabel)) {
    reasons.push('"rn" visually replaces "m"');
  }
  if (/vv/.test(lower) && brandLabel.includes("w")) {
    reasons.push('"vv" visually replaces "w"');
  }
  if (/0/.test(lower) && brandLabel.includes("o")) {
    reasons.push('"0" visually replaces "o"');
  }
  if (/1/.test(lower) && (brandLabel.includes("l") || brandLabel.includes("i"))) {
    reasons.push('"1" visually replaces "l"/"i"');
  }
  if (/[аеорсухіј]/i.test(candidate)) {
    reasons.push("Cyrillic lookalike characters detected");
  }
  if (/[αονρτυχιη]/i.test(candidate)) {
    reasons.push("Greek lookalike characters detected");
  }
  if (folded !== lower && folded.includes(brandLabel.slice(0, Math.min(4, brandLabel.length)))) {
    reasons.push("Unicode / confusable folding maps this host toward a trusted brand label");
  }

  // Case: capital i vs lowercase L in paypaI style (already lowercased in callers, but keep note)
  if (candidate !== candidate.toLowerCase() && /I/.test(candidate) && brandLabel.includes("l")) {
    reasons.push('Capital "I" may be used to mimic lowercase "l"');
  }

  return reasons;
}
