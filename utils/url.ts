const SUSPICIOUS_KEYWORDS = [
  "login",
  "signin",
  "secure",
  "account",
  "verify",
  "update",
  "banking",
  "paypal",
  "amazon",
  "microsoft",
  "apple",
  "wallet",
  "crypto",
  "airdrop",
  "free",
  "gift",
  "urgent",
  "suspended",
  "confirm",
  "password",
  "support",
] as const;

export function normalizeUrl(input: string): {
  normalized: string;
  protocol: string;
  domain: string;
  hostname: string;
} {
  const withProtocol = /^https?:\/\//i.test(input.trim())
    ? input.trim()
    : `https://${input.trim()}`;
  const parsed = new URL(withProtocol);
  parsed.hash = "";
  const hostname = parsed.hostname.toLowerCase();
  return {
    normalized: parsed.toString(),
    protocol: parsed.protocol.replace(":", ""),
    domain: hostname.replace(/^www\./, ""),
    hostname,
  };
}

export function extractSuspiciousKeywords(url: string): string[] {
  const lower = url.toLowerCase();
  return SUSPICIOUS_KEYWORDS.filter((keyword) => lower.includes(keyword));
}

export function hasIpHostname(hostname: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.includes(":");
}

export function looksLikeHomoglyph(hostname: string): boolean {
  return /[0o]/.test(hostname) && /(amaz[0o]n|g[0o]{2}gle|micr[0o]s[0o]ft|paypa[l1]|faceb[0o]{2}k)/i.test(hostname);
}

export function estimateDomainAgeDays(domain: string): number | null {
  // Heuristic stand-in when WHOIS is unavailable: shorter/newer-looking TLDs and digits score younger.
  if (/\d{2,}/.test(domain) || domain.split(".").some((p) => p.length <= 3 && /\d/.test(p))) {
    return 14;
  }
  if (domain.endsWith(".xyz") || domain.endsWith(".top") || domain.endsWith(".icu")) {
    return 45;
  }
  if (domain.endsWith(".com") || domain.endsWith(".org") || domain.endsWith(".net")) {
    return 1200;
  }
  return 180;
}
