/**
 * OCR-aware URL extraction & healing for screenshot text.
 * Handles scheme-less hosts, split tokens, trailing punctuation, and common OCR glitches.
 */

const TRAILING_PUNCT_RE = /[.,;:!?）)」』】\]}>'"”’]+$/g;
const LEADING_PUNCT_RE = /^[({[<「『“"']+/g;

/** Common TLDs used to recognize scheme-less domains in OCR. */
const KNOWN_TLDS =
  "com|org|net|edu|gov|io|ai|app|dev|co|in|uk|us|info|biz|xyz|top|site|click|live|shop|vip|online|me|tv|cc|ly|to|gg|so|page|cloud|tech|security|support";

/**
 * Heal OCR artifacts that commonly break URL regex matching.
 */
export function healOcrUrlText(raw: string): string {
  let text = (raw ?? "").normalize("NFKC");

  // Zero-width / soft hyphen noise
  text = text.replace(/[\u200B-\u200D\uFEFF\u00AD]/g, "");

  // "htt ps://", "http s://", "h ttps : //"
  text = text.replace(
    /\bh\s*t\s*t\s*p\s*(s?)\s*:\s*\/\s*\/\s*/gi,
    (_m, s: string) => `http${s ? "s" : ""}://`,
  );

  // "www . example . com" / "login . rnicrosoft . com"
  text = text.replace(/\b((?:[a-z0-9-]+\s*\.\s*)+[a-z]{2,24})(?:\s*\/\s*[^\s]*)?/gi, (match) =>
    match.replace(/\s*\.\s*/g, ".").replace(/\s*\/\s*/g, "/"),
  );

  // Spaces inside https://host paths: "https://login .rnicrosoft.com/path"
  text = text.replace(/(https?:\/\/)([^\s<>"']+)/gi, (_m, proto: string, rest: string) => {
    // Remove spaces that OCR inserted around dots/slashes in the authority+path
    const healed = rest
      .replace(/\s*\.\s*/g, ".")
      .replace(/\s*\/\s*/g, "/")
      .replace(/\s+/g, "");
    return proto + healed;
  });

  // Collapse leftover multi-spaces (keep single space between words)
  text = text
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n+/g, "\n")
    .trim();

  return text;
}

export interface ExtractedOcrUrl {
  raw: string;
  normalized: string;
  start: number;
  end: number;
  source: "scheme" | "www" | "bare-domain";
}

function stripWrapping(value: string): string {
  return value.replace(LEADING_PUNCT_RE, "").replace(TRAILING_PUNCT_RE, "").trim();
}

function ensureHttpUrl(value: string): string | null {
  const cleaned = stripWrapping(value);
  if (!cleaned) return null;

  let candidate = cleaned;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(candidate)) {
    candidate = `https://${candidate.replace(/^\/+/, "")}`;
  }

  try {
    const u = new URL(candidate);
    if (!["http:", "https:"].includes(u.protocol)) return null;
    if (!u.hostname || u.hostname.length < 3) return null;
    // Reject single-label nonsense like "https://login" (no TLD) unless IP
    const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(u.hostname) || u.hostname.includes(":");
    if (!isIp && !u.hostname.includes(".")) return null;
    // Drop trailing slash-only noise for root comparisons later
    return u.toString();
  } catch {
    return null;
  }
}

/**
 * Extract and normalize URLs from OCR text (after healing).
 * Positions map into the healed text string.
 */
export function extractUrlsFromOcrText(ocrText: string): ExtractedOcrUrl[] {
  const text = healOcrUrlText(ocrText);
  const found: ExtractedOcrUrl[] = [];
  const seen = new Set<string>();

  const push = (raw: string, start: number, end: number, source: ExtractedOcrUrl["source"]) => {
    const normalized = ensureHttpUrl(raw);
    if (!normalized) return;
    const key = normalized.toLowerCase().replace(/\/$/, "");
    if (seen.has(key)) return;
    seen.add(key);
    found.push({ raw: stripWrapping(raw), normalized, start, end, source });
  };

  // 1) Explicit scheme URLs
  const schemeRe = /https?:\/\/[^\s<>"']+/gi;
  let m: RegExpExecArray | null;
  while ((m = schemeRe.exec(text)) !== null) {
    push(m[0], m.index, m.index + m[0].length, "scheme");
  }

  // 2) www. domains
  const wwwRe = /\bwww\.(?:[a-z0-9-]+\.)+[a-z]{2,24}(?:\/[^\s<>"']*)?/gi;
  while ((m = wwwRe.exec(text)) !== null) {
    push(m[0], m.index, m.index + m[0].length, "www");
  }

  // 3) Bare domains (incl. subdomains) with optional path
  const bareRe = new RegExp(
    `\\b(?:[a-z0-9-]+\\.)+(?:${KNOWN_TLDS})(?:\\/[\\w.?%&=+\\-/#]*)?`,
    "gi",
  );
  while ((m = bareRe.exec(text)) !== null) {
    // Skip if already covered by a longer scheme match overlapping this span
    const overlaps = found.some((f) => m!.index >= f.start && m!.index < f.end);
    if (overlaps) continue;
    push(m[0], m.index, m.index + m[0].length, "bare-domain");
  }

  return found;
}

/**
 * Produce healed OCR text suitable for the general detection pipeline,
 * preserving URL tokens so scheme regexes also succeed.
 */
export function prepareOcrTextForDetection(ocrText: string): string {
  return healOcrUrlText(ocrText);
}
