import type { ValidationResult } from "@/services/detection/types";
import { analyzeUrlIntelligence } from "./analyze";
import type { UrlIntelligenceResult } from "./types";

export interface SharedUrlValidation extends ValidationResult {
  intelligence?: UrlIntelligenceResult;
}

/**
 * Shared validator used by both the URL scanner path and OCR detection pipeline.
 */
export function validateAndAnalyzeUrl(value: string): SharedUrlValidation {
  const trimmed = value.trim();
  try {
    const u = new URL(trimmed);
    if (!["http:", "https:", "upi:", "otpauth:"].includes(u.protocol)) {
      return { valid: false, method: "URL Parse" };
    }
    if (u.protocol === "upi:" || u.protocol === "otpauth:") {
      return { valid: true, method: "URL Parse", normalizedValue: u.toString() };
    }

    const intelligence = analyzeUrlIntelligence(trimmed);
    return {
      valid: true,
      method: "URL Intelligence",
      normalizedValue: intelligence.normalizedUrl,
      detail: intelligence.threatCategories.join(", "),
      intelligence,
    };
  } catch {
    // Try prepending https for scheme-less hosts extracted from OCR
    try {
      if (!/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
        const intelligence = analyzeUrlIntelligence(`https://${trimmed}`);
        return {
          valid: true,
          method: "URL Intelligence",
          normalizedValue: intelligence.normalizedUrl,
          detail: intelligence.threatCategories.join(", "),
          intelligence,
        };
      }
    } catch {
      /* fall through */
    }
    return { valid: false, method: "URL Parse" };
  }
}
