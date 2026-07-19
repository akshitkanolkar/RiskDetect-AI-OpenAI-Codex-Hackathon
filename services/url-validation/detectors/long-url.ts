import type { ParsedUrlParts } from "../types";

const LONG_URL_CHARS = 120;
const EXCESSIVE_PARAMS = 6;

export function detectLongOrObfuscatedUrl(parsed: ParsedUrlParts): {
  isLong: boolean;
  hasExcessiveParams: boolean;
  hasEncodedPayload: boolean;
  hasRepeatedSlashes: boolean;
  hasBase64Fragment: boolean;
  reasons: string[];
} {
  const full = parsed.normalized;
  const reasons: string[] = [];
  const isLong = full.length >= LONG_URL_CHARS;
  if (isLong) {
    reasons.push(`URL length is excessive (${full.length} characters)`);
  }

  const params = new URLSearchParams(parsed.search);
  const hasExcessiveParams = [...params.keys()].length >= EXCESSIVE_PARAMS;
  if (hasExcessiveParams) {
    reasons.push(`Excessive query parameters (${[...params.keys()].length})`);
  }

  const hasEncodedPayload =
    /%(?:2[Ee]|3[Dd]|2[Ff]|25){3,}/i.test(full) || /%3C|%3E|%00/i.test(full);
  if (hasEncodedPayload) {
    reasons.push("Heavily encoded payload / escape sequences in URL");
  }

  const hasRepeatedSlashes = /\/\/{2,}/.test(parsed.path);
  if (hasRepeatedSlashes) {
    reasons.push("Repeated slashes in path (possible obfuscation / redirect chain)");
  }

  if (
    [...params.keys()].some((k) => /^(url|redirect|redir|next|return|continue|dest|goto)$/i.test(k))
  ) {
    reasons.push("Contains redirect-style query parameters");
  }

  const hasBase64Fragment =
    /[A-Za-z0-9+/]{24,}={0,2}/.test(parsed.path + parsed.search) &&
    /(?:eyJ|[A-Za-z0-9+/]{32,})/.test(parsed.path + parsed.search);
  if (hasBase64Fragment) {
    reasons.push("Possible Base64-encoded fragment in path or query");
  }

  return {
    isLong,
    hasExcessiveParams,
    hasEncodedPayload,
    hasRepeatedSlashes,
    hasBase64Fragment,
    reasons,
  };
}
