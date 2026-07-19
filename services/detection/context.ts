import type { ContextSignal, EntityType } from "./types";

const CONTEXT_GROUPS: Array<{ label: string; keywords: string[]; boost: number }> = [
  {
    label: "Support Section",
    keywords: ["support", "helpdesk", "customer care", "contact us"],
    boost: 18,
  },
  { label: "Invoice / Receipt", keywords: ["invoice", "receipt", "bill", "tax"], boost: 16 },
  {
    label: "Payment Context",
    keywords: ["payment", "paid", "upi", "transaction", "ref no", "utr", "order"],
    boost: 20,
  },
  {
    label: "Account Context",
    keywords: ["account", "a/c", "ifsc", "bank", "beneficiary"],
    boost: 18,
  },
  {
    label: "OTP / Auth",
    keywords: ["otp", "one time", "verification code", "authenticate"],
    boost: 14,
  },
  {
    label: "Card Context",
    keywords: ["card", "cvv", "cvc", "expiry", "valid thru", "visa", "mastercard", "rupay"],
    boost: 22,
  },
  {
    label: "Identity Document",
    keywords: ["aadhaar", "pan", "passport", "kyc", "identity"],
    boost: 20,
  },
  {
    label: "Credentials",
    keywords: ["password", "secret", "token", "api key", "authorization", "bearer"],
    boost: 24,
  },
];

export function analyzeContext(windowText: string, entityType: EntityType): ContextSignal {
  const lower = windowText.toLowerCase();
  const matched: string[] = [];
  let score = 0;
  let label = "General";

  for (const group of CONTEXT_GROUPS) {
    const hits = group.keywords.filter((k) => lower.includes(k));
    if (hits.length === 0) continue;
    matched.push(...hits);
    const groupScore = group.boost + hits.length * 2;
    if (groupScore > score) {
      score = groupScore;
      label = group.label;
    }
  }

  // Type-specific nudges
  if (entityType === "email" && /support|noreply|no-reply|help/i.test(windowText)) {
    score += 12;
    label = "Support Section";
  }
  if (entityType === "upi" && /pay|upi|collect|request money/i.test(windowText)) {
    score += 10;
    label = "Payment Context";
  }
  if (
    (entityType === "credit_card" || entityType === "debit_card") &&
    /card|visa|master/i.test(windowText)
  ) {
    score += 10;
    label = "Card Context";
  }

  return {
    label,
    score: Math.min(40, score),
    keywords: Array.from(new Set(matched)),
  };
}

export function hasKeywordContext(windowText: string, keywords: string[]): boolean {
  const lower = windowText.toLowerCase();
  return keywords.some((k) => lower.includes(k.toLowerCase()));
}
