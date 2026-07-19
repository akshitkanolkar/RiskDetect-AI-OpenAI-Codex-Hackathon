import type { FindingBoundingBox, ImageFinding } from "@/types/scans";

export interface OcrWord {
  text: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
}

function compact(value: string): string {
  return value.toLowerCase().replace(/[\s\-_.]+/g, "");
}

function unionBox(words: OcrWord[]): FindingBoundingBox {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const word of words) {
    x0 = Math.min(x0, word.bbox.x0);
    y0 = Math.min(y0, word.bbox.y0);
    x1 = Math.max(x1, word.bbox.x1);
    y1 = Math.max(y1, word.bbox.y1);
  }
  const pad = 3;
  return {
    x: Math.max(0, x0 - pad),
    y: Math.max(0, y0 - pad),
    width: Math.max(1, x1 - x0 + pad * 2),
    height: Math.max(1, y1 - y0 + pad * 2),
  };
}

/**
 * Map text findings onto OCR word geometry without touching the detection pipeline.
 * Uses sliding-window concat of consecutive words against the finding value.
 */
export function attachBoundingBoxes(findings: ImageFinding[], words: OcrWord[]): ImageFinding[] {
  if (!words.length) return findings;

  const usedRanges: Array<{ start: number; end: number }> = [];

  return findings.map((finding) => {
    if (finding.bbox) return finding;
    const target = compact(finding.value);
    if (!target || target.length < 2) return finding;

    let best: { start: number; end: number; score: number } | null = null;

    for (let i = 0; i < words.length; i++) {
      if (usedRanges.some((r) => i >= r.start && i <= r.end)) continue;

      let joined = "";
      for (let j = i; j < Math.min(words.length, i + 24); j++) {
        joined += compact(words[j].text);
        if (!joined) continue;

        if (joined === target || (target.length >= 4 && joined.includes(target))) {
          const score =
            joined === target ? 1000 - (j - i) : 500 - Math.abs(joined.length - target.length);
          if (!best || score > best.score) {
            best = { start: i, end: j, score };
          }
          break;
        }

        if (joined.length > target.length + 8) break;
      }
    }

    if (!best) {
      // Soft fallback: distinctive fragment (prefer host label over "https")
      const hostFragment = target
        .replace(/^https?/i, "")
        .replace(/^www/i, "")
        .slice(0, Math.min(12, Math.max(0, target.length - 4)));
      const fragment =
        hostFragment.length >= 4 ? hostFragment : target.slice(0, Math.min(8, target.length));
      const idx = words.findIndex(
        (w) => compact(w.text).includes(fragment) && fragment.length >= 3,
      );
      if (idx === -1) {
        // Try registrable-looking token inside the URL value
        const tokens = finding.value.toLowerCase().match(/[a-z0-9]{5,}/g) ?? [];
        const hit = tokens.findIndex((t) =>
          words.some((w) => compact(w.text).includes(compact(t))),
        );
        if (hit === -1) return finding;
        const token = tokens[hit]!;
        const wordIdx = words.findIndex((w) => compact(w.text).includes(compact(token)));
        if (wordIdx === -1) return finding;
        best = { start: wordIdx, end: wordIdx, score: 1 };
      } else {
        best = { start: idx, end: idx, score: 1 };
      }
    }

    usedRanges.push({ start: best.start, end: best.end });
    return {
      ...finding,
      bbox: unionBox(words.slice(best.start, best.end + 1)),
    };
  });
}

export function riskScoreForFinding(level: ImageFinding["risk_level"]): number {
  switch (level) {
    case "critical":
      return 95;
    case "high":
      return 78;
    case "medium":
      return 55;
    case "low":
      return 28;
    default:
      return 8;
  }
}
