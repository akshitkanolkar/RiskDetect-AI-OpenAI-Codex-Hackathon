import { SHORTENER_DOMAINS } from "../brands";
import type { ParsedUrlParts } from "../types";

export function detectShortenedUrl(parsed: ParsedUrlParts): {
  detected: boolean;
  reasons: string[];
} {
  const domain = parsed.rootDomain.toLowerCase();
  const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
  const detected = SHORTENER_DOMAINS.has(domain) || SHORTENER_DOMAINS.has(host);
  if (!detected) return { detected: false, reasons: [] };
  return {
    detected: true,
    reasons: [
      `URL shortener detected (${domain}) — final destination cannot be verified without expansion`,
    ],
  };
}
