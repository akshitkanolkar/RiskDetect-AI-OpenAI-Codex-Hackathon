import type { ValidationResult } from "../types";

const IPV4_RE = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;

const MAC_RE = /^(?:[0-9A-Fa-f]{2}([:-]))(?:[0-9A-Fa-f]{2}\1){4}[0-9A-Fa-f]{2}$/;

export function validateIpv4(value: string): ValidationResult {
  const trimmed = value.trim();
  if (!IPV4_RE.test(trimmed)) {
    return { valid: false, method: "IPv4 Format" };
  }
  // Skip common non-sensitive / documentation ranges noise lightly
  if (trimmed.startsWith("0.") || trimmed === "255.255.255.255") {
    return { valid: false, method: "IPv4 Format", detail: "Non-routable / broadcast" };
  }
  return { valid: true, method: "IPv4 Format", normalizedValue: trimmed };
}

export function validateMac(value: string): ValidationResult {
  const trimmed = value.trim();
  if (!MAC_RE.test(trimmed)) {
    return { valid: false, method: "MAC Format" };
  }
  if (/^([0]{2}[:-]){5}[0]{2}$/i.test(trimmed) || /^([fF]{2}[:-]){5}[fF]{2}$/.test(trimmed)) {
    return { valid: false, method: "MAC Format", detail: "Null/broadcast MAC" };
  }
  return { valid: true, method: "MAC Format", normalizedValue: trimmed.toLowerCase() };
}

export function validateUrl(value: string): ValidationResult {
  const trimmed = value.trim();
  try {
    const u = new URL(trimmed);
    if (!["http:", "https:", "upi:", "otpauth:"].includes(u.protocol)) {
      return { valid: false, method: "URL Parse" };
    }
    return { valid: true, method: "URL Parse", normalizedValue: u.toString() };
  } catch {
    return { valid: false, method: "URL Parse" };
  }
}
