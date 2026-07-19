import { domainToUnicode } from "node:url";
import type { ParsedUrlParts } from "./types";

/** Common multi-label public suffixes for registrable-domain parsing. */
const MULTI_PART_SUFFIXES = new Set([
  "co.uk",
  "org.uk",
  "ac.uk",
  "gov.uk",
  "co.in",
  "com.au",
  "net.au",
  "co.jp",
  "com.br",
  "co.za",
  "com.mx",
  "com.sg",
  "co.kr",
  "com.tw",
  "com.hk",
  "com.cn",
  "co.nz",
  "com.tr",
]);

const IPV4_RE = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;

export function isIpv4(hostname: string): boolean {
  return IPV4_RE.test(hostname);
}

export function isIpHostname(hostname: string): boolean {
  if (isIpv4(hostname)) return true;
  // IPv6 in URL hostname is typically bracketed; strip brackets for check
  const bare = hostname.replace(/^\[|\]$/g, "");
  return bare.includes(":") && /^[0-9a-f:.]+$/i.test(bare);
}

/**
 * Split hostname into root domain, registrable label, subdomains, and TLD.
 */
export function parseHostnameParts(hostname: string): {
  rootDomain: string;
  registrableLabel: string;
  subdomains: string[];
  tld: string;
} {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (isIpHostname(host)) {
    return { rootDomain: host, registrableLabel: host, subdomains: [], tld: "" };
  }

  const labels = host.split(".").filter(Boolean);
  if (labels.length === 1) {
    return { rootDomain: host, registrableLabel: host, subdomains: [], tld: "" };
  }

  const lastTwo = labels.slice(-2).join(".");
  const lastThree = labels.length >= 3 ? labels.slice(-3).join(".") : "";

  let suffixLen = 1;
  let rootLen = 2;
  if (MULTI_PART_SUFFIXES.has(lastTwo) && labels.length >= 3) {
    suffixLen = 2;
    rootLen = 3;
  } else if (MULTI_PART_SUFFIXES.has(lastThree.slice(lastThree.indexOf(".") + 1))) {
    // e.g. example.co.uk already handled by lastTwo
    suffixLen = 2;
    rootLen = 3;
  }

  const rootDomain = labels.slice(-rootLen).join(".");
  const tld = labels.slice(-suffixLen).join(".");
  const registrableLabel = labels[labels.length - suffixLen - 1] ?? labels[0]!;
  const subdomains = labels.slice(0, Math.max(0, labels.length - rootLen));

  return { rootDomain, registrableLabel, subdomains, tld };
}

/**
 * Normalize and parse a raw URL string into structured parts.
 */
export function parseUrl(input: string): ParsedUrlParts {
  const trimmed = input.trim();
  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new Error(`Invalid URL: ${input}`);
  }

  parsed.hash = "";
  const hostname = parsed.hostname.toLowerCase();
  let unicodeHostname = hostname;
  try {
    unicodeHostname = domainToUnicode(hostname);
  } catch {
    unicodeHostname = hostname;
  }

  const { rootDomain, registrableLabel, subdomains, tld } = parseHostnameParts(hostname);

  return {
    raw: input,
    normalized: parsed.toString(),
    protocol: parsed.protocol.replace(":", ""),
    hostname,
    unicodeHostname: unicodeHostname.toLowerCase(),
    rootDomain: rootDomain.replace(/^www\./, ""),
    registrableLabel,
    subdomains,
    tld,
    path: parsed.pathname,
    search: parsed.search,
    port: parsed.port,
    isIpHost: isIpHostname(hostname),
  };
}

/** Back-compat shape matching utils/url.normalizeUrl */
export function normalizeUrl(input: string): {
  normalized: string;
  protocol: string;
  domain: string;
  hostname: string;
} {
  const p = parseUrl(input);
  return {
    normalized: p.normalized,
    protocol: p.protocol,
    domain: p.hostname.replace(/^www\./, ""),
    hostname: p.hostname,
  };
}
