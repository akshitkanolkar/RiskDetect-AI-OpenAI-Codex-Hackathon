import type { ParsedUrlParts } from "../types";

export function detectIpAddressUrl(parsed: ParsedUrlParts): {
  detected: boolean;
  reasons: string[];
} {
  if (!parsed.isIpHost) return { detected: false, reasons: [] };
  return {
    detected: true,
    reasons: [`Hostname is a raw IP address (${parsed.hostname}) rather than a domain name`],
  };
}
