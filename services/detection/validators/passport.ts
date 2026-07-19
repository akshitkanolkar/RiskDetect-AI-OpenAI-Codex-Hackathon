import type { ValidationResult } from "../types";

/** Indian passport: 1 letter + 7 digits. */
const PASSPORT_RE = /^[A-Z][0-9]{7}$/;

export function validatePassport(value: string): ValidationResult {
  const normalized = value.trim().toUpperCase();
  if (!PASSPORT_RE.test(normalized)) {
    return { valid: false, method: "Passport Format" };
  }
  return { valid: true, method: "Passport Format", normalizedValue: normalized };
}
