import type { EntityType, RawCandidate } from "./types";
import { cachedRegex } from "./utils/regex-cache";

interface ExtractorDef {
  type: EntityType;
  pattern: string;
  flags?: string;
  name: string;
}

/**
 * Candidate extractors only — every hit must still pass a validator.
 * Order matters for overlapping numeric patterns (handled later by priority).
 */
const EXTRACTORS: ExtractorDef[] = [
  {
    type: "email",
    name: "email",
    pattern:
      "[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+",
  },
  {
    type: "upi",
    name: "upi_vpa",
    // Intentionally broader; email TLD rejection happens in validator
    pattern: "\\b[a-zA-Z0-9._-]{2,64}@[a-zA-Z][a-zA-Z0-9]{1,32}\\b",
  },
  {
    type: "phone",
    name: "phone",
    pattern: "(?:\\+\\d{1,3}[\\s-]?)?(?:\\(?\\d{2,4}\\)?[\\s-]?)?\\d{3,5}[\\s-]?\\d{3,5}",
  },
  {
    type: "aadhaar",
    name: "aadhaar_groups",
    pattern: "\\b\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}\\b",
  },
  {
    type: "credit_card",
    name: "card_digits",
    pattern: "\\b(?:\\d[ \\-]*){13,19}\\b",
  },
  {
    type: "pan",
    name: "pan",
    pattern: "\\b[A-Z]{5}[0-9]{4}[A-Z]\\b",
    flags: "g",
  },
  {
    type: "ifsc",
    name: "ifsc",
    pattern: "\\b[A-Z]{4}0[A-Z0-9]{6}\\b",
    flags: "g",
  },
  {
    type: "passport",
    name: "passport",
    pattern: "\\b[A-Z][0-9]{7}\\b",
    flags: "g",
  },
  {
    type: "card_expiry",
    name: "card_expiry",
    pattern: "\\b(?:0[1-9]|1[0-2])[\\/\\-](?:\\d{2}|\\d{4})\\b",
  },
  {
    type: "cvv",
    name: "cvv_label",
    pattern: "(?:cvv|cvc|security\\s*code)\\s*[:=]?\\s*(\\d{3,4})",
    flags: "gi",
  },
  {
    type: "bank_account",
    name: "account_label",
    pattern: "(?:account\\s*(?:no|number|#)?|a\\/c)\\s*[:=]?\\s*(\\d{9,18})",
    flags: "gi",
  },
  {
    type: "password",
    name: "password_label",
    pattern: "(?:password|passwd|pwd|passphrase)\\s*[:=]\\s*\\S+",
    flags: "gi",
  },
  {
    type: "api_key",
    name: "openai_stripe",
    pattern:
      "\\b(?:sk-(?:proj-)?[A-Za-z0-9_-]{20,}|sk_live_[A-Za-z0-9]{20,}|sk_test_[A-Za-z0-9]{20,}|rk_live_[A-Za-z0-9]{20,})\\b",
  },
  {
    type: "aws_key",
    name: "aws_akia",
    pattern: "\\b(?:AKIA|ASIA)[0-9A-Z]{16}\\b",
  },
  {
    type: "github_token",
    name: "github",
    pattern:
      "\\b(?:gh[pousr]_[A-Za-z0-9_]{36,}|github_pat_[A-Za-z0-9_]{20,}|gho_[A-Za-z0-9_]{36,})\\b",
  },
  {
    type: "api_key",
    name: "google_api",
    pattern: "\\bAIza[0-9A-Za-z_-]{35}\\b",
  },
  {
    type: "jwt",
    name: "jwt",
    pattern: "\\beyJ[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\b",
  },
  {
    type: "secret",
    name: "bearer",
    pattern: "Bearer\\s+[A-Za-z0-9\\-._~+/]+=*",
    flags: "gi",
  },
  {
    type: "private_key",
    name: "pem",
    pattern:
      "-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\\s\\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----",
    flags: "g",
  },
  {
    type: "url",
    name: "url",
    pattern: "https?:\\/\\/[^\\s<>\"']+|upi:\\/\\/[^\\s<>\"']+|otpauth:\\/\\/[^\\s<>\"']+",
    flags: "gi",
  },
  {
    type: "ip_address",
    name: "ipv4",
    pattern: "\\b(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\b",
  },
  {
    type: "mac_address",
    name: "mac",
    pattern: "\\b(?:[0-9A-Fa-f]{2}([:\\-]))(?:[0-9A-Fa-f]{2}\\1){4}[0-9A-Fa-f]{2}\\b",
  },
  {
    type: "transaction_id",
    name: "txn",
    pattern: "\\b(?:pay_|upi_ref_|UTR|rzp_|order_|pi_|ch_|txn_)[A-Za-z0-9_-]{6,}\\b",
    flags: "gi",
  },
  {
    type: "order_id",
    name: "order",
    pattern: "\\b(?:ORD|ORDER)[-_]?[A-Z0-9]{6,}\\b",
    flags: "gi",
  },
  {
    type: "invoice_id",
    name: "invoice",
    pattern: "\\b(?:INV|INVOICE)[-_]?[A-Z0-9]{4,}\\b",
    flags: "gi",
  },
  {
    type: "qr",
    name: "qr_hint",
    pattern: "(?:qr\\s*code|scan\\s*to\\s*pay)",
    flags: "gi",
  },
];

export function extractCandidates(text: string): RawCandidate[] {
  const out: RawCandidate[] = [];

  for (const def of EXTRACTORS) {
    const re = cachedRegex(def.pattern, def.flags ?? "g");
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      // Prefer capture group when present (cvv/account)
      const value = (match[1] ?? match[0]).trim();
      if (!value) continue;
      const offset = match[1] ? match[0].indexOf(match[1]) : 0;
      const start = match.index + Math.max(0, offset);
      out.push({
        type: def.type,
        value,
        start,
        end: start + value.length,
        matchedPattern: def.name,
      });
      // Prevent zero-length infinite loops
      if (match[0].length === 0) re.lastIndex += 1;
    }
  }

  return out;
}
