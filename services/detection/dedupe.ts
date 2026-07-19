import type { ScoredFinding } from "./types";

/** Prefer higher-confidence / more specific entity when values collide. */
const TYPE_PRIORITY: Record<string, number> = {
  private_key: 100,
  password: 95,
  api_key: 94,
  aws_key: 94,
  github_token: 94,
  jwt: 93,
  secret: 90,
  aadhaar: 85,
  pan: 84,
  credit_card: 83,
  debit_card: 83,
  cvv: 82,
  email: 80,
  upi: 70,
  phone: 75,
  ifsc: 72,
  bank_account: 71,
  passport: 70,
  transaction_id: 60,
  order_id: 55,
  invoice_id: 55,
  url: 50,
  qr: 48,
  ip_address: 40,
  mac_address: 40,
  card_expiry: 45,
  sensitive: 10,
};

function normKey(value: string): string {
  return value.toLowerCase().replace(/[\s-]/g, "");
}

/**
 * Deduplicate by normalized value; keep the highest-priority / highest-confidence finding.
 * Also drop lower-priority overlaps on the same digit string (phone vs aadhaar vs card).
 */
export function dedupeFindings(findings: ScoredFinding[]): ScoredFinding[] {
  const byValue = new Map<string, ScoredFinding>();

  const ranked = [...findings].sort((a, b) => {
    const pa = TYPE_PRIORITY[a.type] ?? 0;
    const pb = TYPE_PRIORITY[b.type] ?? 0;
    if (pb !== pa) return pb - pa;
    return b.confidence - a.confidence;
  });

  for (const f of ranked) {
    const key = `${f.type}:${normKey(f.value)}`;
    if (!byValue.has(key)) {
      byValue.set(key, f);
    }
  }

  // Cross-type collision on same digit blob: keep highest priority only
  const digitOwners = new Map<string, ScoredFinding>();
  const result: ScoredFinding[] = [];

  for (const f of byValue.values()) {
    const digits = f.value.replace(/\D/g, "");
    if (digits.length >= 10) {
      const existing = digitOwners.get(digits);
      if (existing) {
        const pe = TYPE_PRIORITY[existing.type] ?? 0;
        const pf = TYPE_PRIORITY[f.type] ?? 0;
        if (pf <= pe) continue;
        // replace
        const idx = result.indexOf(existing);
        if (idx >= 0) result.splice(idx, 1);
      }
      digitOwners.set(digits, f);
    }
    result.push(f);
  }

  // Email always wins over UPI for same raw string
  const emails = new Set(result.filter((f) => f.type === "email").map((f) => normKey(f.value)));
  return result.filter((f) => {
    if (f.type === "upi" && emails.has(normKey(f.value))) return false;
    return true;
  });
}
