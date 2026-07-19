import type { ValidationResult } from "../types";

/** Practical RFC 5322-inspired email validation (production DLP style). */
const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const COMMON_TLDS = new Set([
  "com",
  "org",
  "net",
  "co",
  "io",
  "ai",
  "in",
  "uk",
  "us",
  "edu",
  "gov",
  "info",
  "biz",
  "app",
  "dev",
  "me",
  "email",
]);

export function validateEmail(value: string): ValidationResult {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed || trimmed.length > 254) {
    return { valid: false, method: "RFC Email" };
  }
  if (!EMAIL_RE.test(trimmed)) {
    return { valid: false, method: "RFC Email", detail: "Malformed email structure" };
  }
  const domain = trimmed.split("@")[1] ?? "";
  const tld = domain.split(".").pop() ?? "";
  if (tld.length < 2) {
    return { valid: false, method: "RFC Email", detail: "Invalid TLD" };
  }
  // Require a real dotted domain (rejects bare UPI-style handles)
  if (!domain.includes(".")) {
    return { valid: false, method: "RFC Email", detail: "Missing domain TLD" };
  }
  return {
    valid: true,
    method: "RFC Email",
    normalizedValue: trimmed,
    detail: COMMON_TLDS.has(tld) ? "Common TLD" : "Valid domain structure",
  };
}

export function looksLikeEmail(value: string): boolean {
  return validateEmail(value).valid;
}
