import type { ValidationResult } from "../types";

/** IFSC: 4 letters + 0 + 6 alphanumeric (e.g. SBIN0001234). */
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export function validateIfsc(value: string): ValidationResult {
  const normalized = value.trim().toUpperCase();
  if (normalized.length !== 11) {
    return { valid: false, method: "IFSC Format", detail: "Must be 11 characters" };
  }
  if (!IFSC_RE.test(normalized)) {
    return { valid: false, method: "IFSC Format", detail: "Must be AAAA0XXXXXX" };
  }
  return { valid: true, method: "IFSC Format", normalizedValue: normalized };
}

export function validateBankAccount(value: string, nearBankContext: boolean): ValidationResult {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 18) {
    return { valid: false, method: "Bank Account + Context", detail: "Invalid length" };
  }
  if (/^(\d)\1+$/.test(digits)) {
    return { valid: false, method: "Bank Account + Context", detail: "Trivial sequence" };
  }
  if (!nearBankContext) {
    return { valid: false, method: "Bank Account + Context", detail: "No banking context" };
  }
  return { valid: true, method: "Bank Account + Context", normalizedValue: digits };
}
