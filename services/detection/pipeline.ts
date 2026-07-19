import { randomUUID } from "crypto";
import type { RiskLevel } from "@/types";
import type {
  DetectionFinding,
  DetectionPipelineResult,
  RawCandidate,
  ScoredFinding,
} from "./types";
import { normalizeOcrText, contextWindow } from "./ocr-normalize";
import { extractCandidates } from "./extractors";
import { analyzeContext, hasKeywordContext } from "./context";
import { computeConfidence } from "./confidence";
import { classifySeverity, riskCategoryFor } from "./severity";
import { explainFinding, labelFor } from "./explanations";
import { recommendFor } from "./recommendations";
import { dedupeFindings } from "./dedupe";
import {
  validateEmail,
  validateUpi,
  validatePhone,
  validateAadhaar,
  validatePan,
  validateCard,
  validateCvv,
  validateCardExpiry,
  validateIfsc,
  validateBankAccount,
  validatePassport,
  classifyApiKey,
  validateBearerToken,
  validatePrivateKey,
  validatePasswordLabel,
  validateIpv4,
  validateMac,
  validateUrl,
  validateTransactionId,
  isLikelyIndianPhoneFrom12Digits,
  digitsOnly,
} from "./validators";

interface Accepted {
  candidate: RawCandidate;
  type: ScoredFinding["type"];
  value: string;
  method: string;
  detail?: string;
}

function validateCandidate(c: RawCandidate, fullText: string): Accepted | null {
  const window = contextWindow(fullText, c.start, c.end);

  switch (c.type) {
    case "email": {
      const r = validateEmail(c.value);
      if (!r.valid) return null;
      return {
        candidate: c,
        type: "email",
        value: r.normalizedValue ?? c.value,
        method: r.method,
        detail: r.detail,
      };
    }
    case "upi": {
      // If it's a valid email, never accept as UPI
      if (validateEmail(c.value).valid) return null;
      const r = validateUpi(c.value);
      if (!r.valid) return null;
      return {
        candidate: c,
        type: "upi",
        value: r.normalizedValue ?? c.value,
        method: r.method,
        detail: r.detail,
      };
    }
    case "phone": {
      const r = validatePhone(c.value);
      if (!r.valid) return null;
      return {
        candidate: c,
        type: "phone",
        value: r.normalizedValue ?? c.value,
        method: r.method,
        detail: r.detail,
      };
    }
    case "aadhaar": {
      const digits = digitsOnly(c.value);
      // Prefer phone when +91 mobile shape
      if (isLikelyIndianPhoneFrom12Digits(digits)) {
        const phone = validatePhone(digits);
        if (phone.valid) {
          return {
            candidate: c,
            type: "phone",
            value: phone.normalizedValue ?? digits,
            method: phone.method,
            detail: "Reclassified from Aadhaar candidate (IN mobile)",
          };
        }
      }
      const r = validateAadhaar(c.value);
      if (!r.valid) return null;
      return {
        candidate: c,
        type: "aadhaar",
        value: r.normalizedValue ?? digits,
        method: r.method,
        detail: r.detail,
      };
    }
    case "credit_card": {
      const r = validateCard(c.value);
      if (!r.valid) return null;
      const type = r.kind === "debit_card" ? "debit_card" : "credit_card";
      return {
        candidate: c,
        type,
        value: r.normalizedValue ?? digitsOnly(c.value),
        method: r.method,
        detail: r.detail,
      };
    }
    case "pan": {
      const r = validatePan(c.value);
      if (!r.valid) return null;
      return { candidate: c, type: "pan", value: r.normalizedValue ?? c.value, method: r.method };
    }
    case "ifsc": {
      const r = validateIfsc(c.value);
      if (!r.valid) return null;
      return { candidate: c, type: "ifsc", value: r.normalizedValue ?? c.value, method: r.method };
    }
    case "passport": {
      // Avoid matching random letter+7digits without passport context
      if (!hasKeywordContext(window, ["passport", "travel", "immigration", "visa"])) {
        return null;
      }
      const r = validatePassport(c.value);
      if (!r.valid) return null;
      return {
        candidate: c,
        type: "passport",
        value: r.normalizedValue ?? c.value,
        method: r.method,
      };
    }
    case "card_expiry": {
      if (!hasKeywordContext(window, ["exp", "expiry", "valid", "card", "cvv", "visa", "master"])) {
        return null;
      }
      const r = validateCardExpiry(c.value);
      if (!r.valid) return null;
      return {
        candidate: c,
        type: "card_expiry",
        value: r.normalizedValue ?? c.value,
        method: r.method,
        detail: r.detail,
      };
    }
    case "cvv": {
      const r = validateCvv(c.value, hasKeywordContext(window, ["cvv", "cvc", "card", "security"]));
      if (!r.valid) return null;
      return { candidate: c, type: "cvv", value: r.normalizedValue ?? c.value, method: r.method };
    }
    case "bank_account": {
      const r = validateBankAccount(
        c.value,
        hasKeywordContext(window, ["account", "bank", "a/c", "ifsc", "beneficiary"]),
      );
      if (!r.valid) return null;
      return {
        candidate: c,
        type: "bank_account",
        value: r.normalizedValue ?? c.value,
        method: r.method,
      };
    }
    case "password": {
      const r = validatePasswordLabel(c.value);
      if (!r.valid) return null;
      return {
        candidate: c,
        type: "password",
        value: r.normalizedValue ?? c.value,
        method: r.method,
      };
    }
    case "api_key":
    case "aws_key":
    case "github_token":
    case "jwt": {
      const r = classifyApiKey(c.value);
      if (!r.valid) return null;
      return {
        candidate: c,
        type: r.type,
        value: r.normalizedValue ?? c.value,
        method: r.method,
        detail: r.detail,
      };
    }
    case "secret": {
      const r = validateBearerToken(c.value);
      if (!r.valid) return null;
      return {
        candidate: c,
        type: "secret",
        value: r.normalizedValue ?? c.value,
        method: r.method,
      };
    }
    case "private_key": {
      const r = validatePrivateKey(c.value);
      if (!r.valid) return null;
      return {
        candidate: c,
        type: "private_key",
        value: "[PRIVATE KEY REDACTED]",
        method: r.method,
      };
    }
    case "url": {
      const r = validateUrl(c.value);
      if (!r.valid) return null;
      return { candidate: c, type: "url", value: r.normalizedValue ?? c.value, method: r.method };
    }
    case "ip_address": {
      const r = validateIpv4(c.value);
      if (!r.valid) return null;
      return {
        candidate: c,
        type: "ip_address",
        value: r.normalizedValue ?? c.value,
        method: r.method,
      };
    }
    case "mac_address": {
      const r = validateMac(c.value);
      if (!r.valid) return null;
      return {
        candidate: c,
        type: "mac_address",
        value: r.normalizedValue ?? c.value,
        method: r.method,
      };
    }
    case "transaction_id":
    case "order_id":
    case "invoice_id": {
      const r = validateTransactionId(
        c.value,
        hasKeywordContext(window, [
          "payment",
          "txn",
          "transaction",
          "utr",
          "order",
          "invoice",
          "paid",
          "razorpay",
        ]),
      );
      if (!r.valid) return null;
      return {
        candidate: c,
        type: r.type ?? c.type,
        value: r.normalizedValue ?? c.value,
        method: r.method,
        detail: r.detail,
      };
    }
    case "qr": {
      return {
        candidate: c,
        type: "qr",
        value: "QR-related content detected in OCR text",
        method: "QR Keyword Heuristic",
        detail: c.value,
      };
    }
    default:
      return null;
  }
}

function toScored(accepted: Accepted, fullText: string): ScoredFinding {
  const { candidate, type, value, method, detail } = accepted;
  const window = contextWindow(fullText, candidate.start, candidate.end);
  const context = analyzeContext(window, type);
  const confidence = computeConfidence({
    type,
    validationMethod: method,
    validationDetail: detail,
    context,
    matchedPattern: candidate.matchedPattern,
  });
  const severity = classifySeverity(type, confidence, context.score);

  const reasonParts = [
    explainFinding(type, value),
    `Validation: ${method}${detail ? ` (${detail})` : ""}.`,
    `Confidence factors: pattern=${candidate.matchedPattern}, context=${context.label} (+${context.score}).`,
  ];

  return {
    type,
    value,
    start: candidate.start,
    end: candidate.end,
    confidence,
    severity,
    reason: reasonParts.join(" "),
    recommendation: recommendFor(type),
    validationMethod: method,
    matchedPattern: candidate.matchedPattern,
    riskCategory: riskCategoryFor(type),
    context: context.label,
    ocrSource: "tesseract",
  };
}

function toImageFinding(f: ScoredFinding): DetectionFinding {
  return {
    id: randomUUID(),
    category: f.type,
    label: labelFor(f.type),
    value: f.value,
    risk_level: f.severity,
    reason: f.reason,
    recommendation: f.recommendation,
    start: f.start,
    end: f.end,
    confidence: f.confidence,
    validation_method: f.validationMethod,
    risk_category: f.riskCategory,
    ocr_source: f.ocrSource,
    context: f.context,
  };
}

export function scoreImageFindings(findings: DetectionFinding[]): number {
  if (findings.length === 0) return 5;
  const weights: Record<RiskLevel, number> = {
    safe: 0,
    low: 12,
    medium: 25,
    high: 40,
    critical: 55,
  };
  const total = findings.reduce((sum, f) => {
    const base = weights[f.risk_level];
    const conf = typeof f.confidence === "number" ? f.confidence / 100 : 1;
    return sum + base * (0.7 + 0.3 * conf);
  }, 0);
  return Math.min(100, Math.round(total));
}

/**
 * Full detection pipeline:
 * OCR normalize → extract → validate → context → confidence → severity → dedupe.
 */
export function runDetectionPipeline(ocrText: string): DetectionPipelineResult {
  const normalized = normalizeOcrText(ocrText);
  const candidates = extractCandidates(normalized.text);

  const accepted: Accepted[] = [];
  for (const c of candidates) {
    const result = validateCandidate(c, normalized.text);
    if (result) accepted.push(result);
  }

  const scored = accepted.map((a) => toScored(a, normalized.text));
  const deduped = dedupeFindings(scored);
  const findings = deduped.map(toImageFinding);

  return {
    findings,
    riskScore: scoreImageFindings(findings),
    normalizedText: normalized.text,
  };
}

/** Back-compat entry used by image scanner / patterns shim. */
export function detectSensitivePatterns(text: string): DetectionFinding[] {
  return runDetectionPipeline(text).findings;
}
