import type { ParsedUrlParts } from "../types";

const DEEP_SUBDOMAIN_THRESHOLD = 3;

export function detectExcessiveSubdomains(parsed: ParsedUrlParts): {
  detected: boolean;
  depth: number;
  reasons: string[];
} {
  const depth = parsed.subdomains.length;
  const detected = depth >= DEEP_SUBDOMAIN_THRESHOLD;
  const reasons: string[] = [];
  if (detected) {
    reasons.push(
      `Unusually deep subdomain chain (${depth} levels): ${parsed.subdomains.join(".") || "(none)"}.${parsed.rootDomain}`,
    );
  }
  return { detected, depth, reasons };
}
