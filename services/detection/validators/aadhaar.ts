import type { ValidationResult } from "../types";
import { digitsOnly, verhoeffCheck } from "../utils/checksums";
import { isLikelyIndianPhoneFrom12Digits } from "./phone";

export function validateAadhaar(value: string): ValidationResult {
  const digits = digitsOnly(value);

  if (digits.length !== 12) {
    return { valid: false, method: "Verhoeff Checksum", detail: "Must be exactly 12 digits" };
  }

  // Aadhaar never starts with 0 or 1
  if (digits[0] === "0" || digits[0] === "1") {
    return { valid: false, method: "Verhoeff Checksum", detail: "Invalid leading digit" };
  }

  // Prefer phone when 91 + valid Indian mobile
  if (isLikelyIndianPhoneFrom12Digits(digits)) {
    return {
      valid: false,
      method: "Verhoeff Checksum",
      detail: "Rejected: overlaps Indian phone (+91)",
    };
  }

  if (!verhoeffCheck(digits)) {
    return { valid: false, method: "Verhoeff Checksum", detail: "Checksum failed" };
  }

  return {
    valid: true,
    method: "Verhoeff Checksum",
    normalizedValue: digits,
    detail: "Checksum passed",
  };
}
