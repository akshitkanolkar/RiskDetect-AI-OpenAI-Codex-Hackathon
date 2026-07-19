import type { FindingCategory, ImageFinding } from "@/types/scans";
import type { RiskLevel } from "@/types";
import { randomUUID } from "crypto";

interface PatternDef {
  category: FindingCategory;
  label: string;
  regex: RegExp;
  risk_level: RiskLevel;
  reason: string;
  recommendation: string;
}

const PATTERNS: PatternDef[] = [
  {
    category: "email",
    label: "Email address",
    regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    risk_level: "medium",
    reason: "Email addresses in screenshots can be harvested for phishing and spam.",
    recommendation: "Blur or remove emails before sharing screenshots publicly.",
  },
  {
    category: "phone",
    label: "Phone number",
    regex: /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}/g,
    risk_level: "medium",
    reason: "Phone numbers enable SIM-swap and social engineering attacks.",
    recommendation: "Mask phone numbers unless the recipient needs them.",
  },
  {
    category: "upi",
    label: "UPI ID",
    regex: /\b[\w.-]+@[a-z]{2,}\b/gi,
    risk_level: "high",
    reason: "UPI IDs can be abused for unauthorized payment requests.",
    recommendation: "Never share UPI IDs in public screenshots.",
  },
  {
    category: "credit_card",
    label: "Credit card pattern",
    regex: /\b(?:\d[ -]*?){13,19}\b/g,
    risk_level: "critical",
    reason: "Card numbers in images are high-value financial exposure.",
    recommendation: "Delete this screenshot and rotate the card if it was shared.",
  },
  {
    category: "pan",
    label: "PAN pattern",
    regex: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g,
    risk_level: "critical",
    reason: "PAN is sensitive Indian tax identity data.",
    recommendation: "Redact PAN and avoid storing identity documents in chats.",
  },
  {
    category: "aadhaar",
    label: "Aadhaar pattern",
    regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    risk_level: "critical",
    reason: "Aadhaar numbers are highly sensitive identity credentials.",
    recommendation: "Never share Aadhaar screenshots; revoke and reissue if leaked.",
  },
  {
    category: "password",
    label: "Password-like secret",
    regex: /(?:password|passwd|pwd|passphrase)\s*[:=]\s*\S+/gi,
    risk_level: "critical",
    reason: "Explicit password text was found in the image.",
    recommendation: "Rotate the password immediately and enable MFA.",
  },
  {
    category: "api_key",
    label: "API key",
    regex: /\b(?:sk-[A-Za-z0-9]{20,}|AIza[0-9A-Za-z\-_]{30,}|AKIA[0-9A-Z]{16})\b/g,
    risk_level: "critical",
    reason: "Cloud or AI API keys enable unauthorized billed access.",
    recommendation: "Revoke and rotate the key in the provider console now.",
  },
  {
    category: "secret",
    label: "Secret token",
    regex: /(?:secret|token|bearer|authorization)\s*[:=]\s*['\"]?[A-Za-z0-9_\-.=]{16,}/gi,
    risk_level: "high",
    reason: "Authentication secrets should never appear in screenshots.",
    recommendation: "Rotate the token and audit recent access logs.",
  },
];

function isLikelyFalsePositive(category: FindingCategory, value: string): boolean {
  if (category === "phone" && value.replace(/\D/g, "").length < 10) return true;
  if (category === "credit_card") {
    const digits = value.replace(/\D/g, "");
    if (digits.length < 13 || digits.length > 19) return true;
  }
  if (category === "upi" && value.includes("@") && value.includes(".")) {
    // Prefer email matcher for classic emails
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return true;
  }
  if (category === "aadhaar") {
    const digits = value.replace(/\D/g, "");
    if (digits.length !== 12) return true;
  }
  return false;
}

export function detectSensitivePatterns(text: string): ImageFinding[] {
  const findings: ImageFinding[] = [];
  const seen = new Set<string>();

  for (const pattern of PATTERNS) {
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const value = match[0].trim();
      if (!value || isLikelyFalsePositive(pattern.category, value)) continue;
      const key = `${pattern.category}:${value.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      findings.push({
        id: randomUUID(),
        category: pattern.category,
        label: pattern.label,
        value,
        risk_level: pattern.risk_level,
        reason: pattern.reason,
        recommendation: pattern.recommendation,
        start: match.index,
        end: match.index + value.length,
      });
    }
  }

  return findings;
}

export function scoreImageFindings(findings: ImageFinding[]): number {
  if (findings.length === 0) return 5;
  const weights: Record<RiskLevel, number> = {
    safe: 0,
    low: 12,
    medium: 25,
    high: 40,
    critical: 55,
  };
  const total = findings.reduce((sum, f) => sum + weights[f.risk_level], 0);
  return Math.min(100, total);
}
