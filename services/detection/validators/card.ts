import type { ValidationResult } from "../types";
import { digitsOnly, luhnCheck } from "../utils/checksums";

const IIN_PREFIXES: Array<{ prefix: RegExp; brand: string; kind: "credit_card" | "debit_card" }> = [
  { prefix: /^4/, brand: "Visa", kind: "credit_card" },
  { prefix: /^5[1-5]/, brand: "Mastercard", kind: "credit_card" },
  { prefix: /^3[47]/, brand: "Amex", kind: "credit_card" },
  { prefix: /^6(?:011|5)/, brand: "Discover", kind: "credit_card" },
  { prefix: /^35/, brand: "JCB", kind: "credit_card" },
  { prefix: /^62/, brand: "UnionPay", kind: "credit_card" },
  { prefix: /^60/, brand: "RuPay", kind: "debit_card" },
  { prefix: /^65/, brand: "RuPay", kind: "debit_card" },
  { prefix: /^81/, brand: "RuPay", kind: "debit_card" },
];

function isTrivialCard(digits: string): boolean {
  if (/^(\d)\1+$/.test(digits)) return true;
  if (/^012345|^123456|^987654/.test(digits)) return true;
  // Reject test patterns that Luhn-pass but are not real cards in screenshots context
  const knownTests = new Set([
    "4111111111111111",
    "4000000000000002",
    "5555555555554444",
    "378282246310005",
  ]);
  // Keep known test cards as valid for positive tests; do not treat as trivial
  void knownTests;
  return false;
}

export function validateCard(value: string): ValidationResult & {
  brand?: string;
  kind?: "credit_card" | "debit_card";
} {
  const digits = digitsOnly(value);

  if (digits.length < 13 || digits.length > 19) {
    return { valid: false, method: "Luhn Algorithm", detail: "Invalid length" };
  }

  if (isTrivialCard(digits)) {
    return { valid: false, method: "Luhn Algorithm", detail: "Trivial digit sequence" };
  }

  if (!luhnCheck(digits)) {
    return { valid: false, method: "Luhn Algorithm", detail: "Luhn checksum failed" };
  }

  const match = IIN_PREFIXES.find((p) => p.prefix.test(digits));
  if (!match) {
    // Luhn-valid but unknown IIN — still accept as card with lower confidence later
    return {
      valid: true,
      method: "Luhn Algorithm",
      normalizedValue: digits,
      detail: "Luhn passed (unknown IIN)",
      brand: "Unknown",
      kind: "credit_card",
    };
  }

  return {
    valid: true,
    method: "Luhn Algorithm",
    normalizedValue: digits,
    detail: `${match.brand} IIN + Luhn`,
    brand: match.brand,
    kind: match.kind,
  };
}

export function validateCvv(value: string, nearCardContext: boolean): ValidationResult {
  const digits = digitsOnly(value);
  if (!/^\d{3,4}$/.test(digits)) {
    return { valid: false, method: "CVV Pattern", detail: "Must be 3–4 digits" };
  }
  if (!nearCardContext) {
    return { valid: false, method: "CVV Pattern", detail: "No nearby card context" };
  }
  return { valid: true, method: "CVV + Context", normalizedValue: digits };
}

export function validateCardExpiry(value: string): ValidationResult {
  const m = value.trim().match(/^(0[1-9]|1[0-2])[\/\-](\d{2}|\d{4})$/);
  if (!m) return { valid: false, method: "Card Expiry Format" };
  const month = Number(m[1]);
  let year = Number(m[2]);
  if (year < 100) year += 2000;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    // Expired cards can still be sensitive exposure — accept but note
    return {
      valid: true,
      method: "Card Expiry Format",
      normalizedValue: `${m[1]}/${String(year).slice(-2)}`,
      detail: "Expired",
    };
  }
  if (year > currentYear + 15) {
    return { valid: false, method: "Card Expiry Format", detail: "Unrealistic year" };
  }
  return {
    valid: true,
    method: "Card Expiry Format",
    normalizedValue: `${m[1]}/${String(year).slice(-2)}`,
  };
}
