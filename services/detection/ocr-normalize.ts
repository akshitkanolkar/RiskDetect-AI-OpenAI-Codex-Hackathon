import type { NormalizedOcr } from "./types";

/** NFKC normalize, collapse whitespace, preserve a stable searchable string. */
export function normalizeOcrText(raw: string): NormalizedOcr {
  const original = raw ?? "";
  const unicodeNormalized = original.normalize("NFKC");
  // Collapse runs of whitespace to single space but keep newlines as spaces for matching
  const text = unicodeNormalized
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const tokens = Array.from(
    new Set(
      text
        .split(" ")
        .map((t) => t.trim())
        .filter((t) => t.length > 1),
    ),
  );

  return { text, original, tokens };
}

/** Window of surrounding text for context scoring. */
export function contextWindow(text: string, start: number, end: number, radius = 48): string {
  const from = Math.max(0, start - radius);
  const to = Math.min(text.length, end + radius);
  return text.slice(from, to);
}
