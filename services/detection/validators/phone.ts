import type { ValidationResult } from "../types";
import { digitsOnly } from "../utils/checksums";

/** Indian mobile: 10 digits starting 6–9, optional +91 / 91 / 0 prefix. */
export function validatePhone(value: string): ValidationResult {
  const raw = value.trim();
  const digits = digitsOnly(raw);

  if (digits.length < 10 || digits.length > 15) {
    return { valid: false, method: "Phone Length/CC", detail: "Invalid length" };
  }

  // Reject obvious all-same / trivial sequences
  if (/^(\d)\1+$/.test(digits) || digits === "1234567890" || digits === "0123456789") {
    return { valid: false, method: "Phone Length/CC", detail: "Trivial digit sequence" };
  }

  let national = digits;
  let countryHint = "unknown";

  if (digits.length === 12 && digits.startsWith("91")) {
    national = digits.slice(2);
    countryHint = "IN(+91)";
  } else if (digits.length === 11 && digits.startsWith("0")) {
    national = digits.slice(1);
    countryHint = "IN(0)";
  } else if (digits.length === 10) {
    countryHint = "IN(local)";
  } else if (digits.length === 11 && digits.startsWith("1")) {
    // NANP
    national = digits.slice(1);
    countryHint = "US(+1)";
  } else if (raw.startsWith("+") && digits.length >= 11 && digits.length <= 15) {
    countryHint = "E.164";
  } else if (digits.length !== 10) {
    return { valid: false, method: "Phone Length/CC", detail: "Unsupported length without +" };
  }

  // Indian mobile validation when IN-shaped
  if (countryHint.startsWith("IN")) {
    if (national.length !== 10 || !/^[6-9]\d{9}$/.test(national)) {
      return { valid: false, method: "Phone Length/CC", detail: "Invalid Indian mobile" };
    }
  }

  // US: area code cannot start with 0/1
  if (countryHint === "US(+1)" && !/^[2-9]\d{2}[2-9]\d{6}$/.test(national)) {
    return { valid: false, method: "Phone Length/CC", detail: "Invalid NANP number" };
  }

  return {
    valid: true,
    method: "Phone Length/CC",
    normalizedValue: digits,
    detail: countryHint,
  };
}

/** True when a 12-digit string is more likely a phone (+91 mobile) than Aadhaar. */
export function isLikelyIndianPhoneFrom12Digits(digits: string): boolean {
  if (digits.length !== 12 || !digits.startsWith("91")) return false;
  const national = digits.slice(2);
  return /^[6-9]\d{9}$/.test(national);
}
