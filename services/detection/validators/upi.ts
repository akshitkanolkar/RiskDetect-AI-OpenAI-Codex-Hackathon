import type { ValidationResult } from "../types";
import { looksLikeEmail } from "./email";

/** Known Indian PSP / bank UPI handles (non-exhaustive, high-signal). */
export const KNOWN_UPI_HANDLES = new Set([
  "ybl",
  "oksbi",
  "okaxis",
  "okicici",
  "okhdfcbank",
  "okyesbank",
  "paytm",
  "ibl",
  "axl",
  "apl",
  "upi",
  "abfspay",
  "federal",
  "sbi",
  "icici",
  "hdfcbank",
  "axisbank",
  "kotak",
  "yesbank",
  "indus",
  "barodampay",
  "freecharge",
  "amazonpay",
  "phonepe",
  "gpay",
  "googlepay",
  "sliceaxis",
  "tapicici",
  "pingpay",
  "jupiteraxis",
  "waaxis",
  "waicici",
  "wahdfcbank",
  "wasbi",
]);

const EMAIL_TLDS = /\.(com|org|net|co|io|ai|in|uk|us|edu|gov|info|biz|app|dev|me|email)$/i;

const UPI_CANDIDATE_RE = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9]{1,63}$/;

export function validateUpi(value: string): ValidationResult {
  const trimmed = value.trim().toLowerCase();

  // Never classify emails as UPI
  if (looksLikeEmail(trimmed) || EMAIL_TLDS.test(trimmed)) {
    return {
      valid: false,
      method: "UPI PSP Handle",
      detail: "Rejected: looks like email / has TLD",
    };
  }

  if (!UPI_CANDIDATE_RE.test(trimmed)) {
    return { valid: false, method: "UPI PSP Handle", detail: "Malformed UPI structure" };
  }

  const handle = trimmed.split("@")[1] ?? "";
  if (!handle || handle.includes(".")) {
    return { valid: false, method: "UPI PSP Handle", detail: "Invalid handle" };
  }

  const known = KNOWN_UPI_HANDLES.has(handle);
  // Accept known PSP handles strongly; allow unknown short alphanumeric handles
  // only when they look like VPA (no dots, 2–20 chars) — still lower confidence later.
  if (!known && (handle.length < 2 || handle.length > 20 || !/^[a-z][a-z0-9]*$/i.test(handle))) {
    return { valid: false, method: "UPI PSP Handle", detail: "Unknown / invalid PSP handle" };
  }

  return {
    valid: true,
    method: known ? "Known UPI PSP Handle" : "UPI VPA Structure",
    normalizedValue: trimmed,
    detail: known ? `Matched @${handle}` : `Structural VPA @${handle}`,
  };
}
