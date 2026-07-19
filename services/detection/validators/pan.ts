import type { ValidationResult } from "../types";

/** PAN: 5 letters + 4 digits + 1 letter (e.g. ABCDE1234F). 4th char is entity type. */
const PAN_RE = /^[A-Z]{3}[ABCFGHLJPTK][A-Z][0-9]{4}[A-Z]$/;

export function validatePan(value: string): ValidationResult {
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(normalized)) {
    return { valid: false, method: "PAN Format", detail: "Must match ABCDE1234F" };
  }
  if (!PAN_RE.test(normalized)) {
    return { valid: false, method: "PAN Format", detail: "Invalid 4th-character entity code" };
  }
  return { valid: true, method: "PAN Format", normalizedValue: normalized };
}
