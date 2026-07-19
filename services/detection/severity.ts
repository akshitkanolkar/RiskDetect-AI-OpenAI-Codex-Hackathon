import type { RiskLevel } from "@/types";
import type { EntityType } from "./types";

const TYPE_SEVERITY: Partial<Record<EntityType, RiskLevel>> = {
  private_key: "critical",
  password: "critical",
  api_key: "critical",
  aws_key: "critical",
  github_token: "critical",
  jwt: "critical",
  secret: "high",
  aadhaar: "critical",
  pan: "critical",
  passport: "critical",
  credit_card: "critical",
  debit_card: "critical",
  cvv: "critical",
  card_expiry: "high",
  bank_account: "high",
  ifsc: "medium",
  upi: "high",
  phone: "medium",
  email: "medium",
  qr: "high",
  url: "medium",
  ip_address: "low",
  mac_address: "low",
  transaction_id: "medium",
  order_id: "low",
  invoice_id: "low",
  sensitive: "medium",
};

const RANK: Record<RiskLevel, number> = {
  safe: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

const FROM_RANK: RiskLevel[] = ["safe", "low", "medium", "high", "critical"];

export function classifySeverity(
  type: EntityType,
  confidence: number,
  contextScore: number,
): RiskLevel {
  const level = TYPE_SEVERITY[type] ?? "medium";
  let rank = RANK[level];

  // Low confidence → dial down (avoid alarming on weak hits)
  if (confidence < 55) rank = Math.max(1, rank - 1);
  if (confidence >= 90 && (type === "api_key" || type === "credit_card" || type === "aadhaar")) {
    rank = Math.min(4, rank + 0);
  }

  // Strong payment/credential context elevates financial IDs
  if (
    contextScore >= 20 &&
    (type === "upi" || type === "bank_account" || type === "transaction_id")
  ) {
    rank = Math.min(4, Math.max(rank, 3));
  }

  // Informational-ish network identifiers stay low unless highly confident
  if ((type === "ip_address" || type === "mac_address" || type === "order_id") && confidence < 80) {
    rank = Math.min(rank, 1);
  }

  return FROM_RANK[rank] ?? "medium";
}

export function riskCategoryFor(type: EntityType): string {
  switch (type) {
    case "email":
    case "phone":
      return "PII";
    case "aadhaar":
    case "pan":
    case "passport":
      return "Government ID";
    case "upi":
    case "credit_card":
    case "debit_card":
    case "cvv":
    case "card_expiry":
    case "bank_account":
    case "ifsc":
    case "transaction_id":
    case "qr":
      return "Financial";
    case "api_key":
    case "aws_key":
    case "github_token":
    case "jwt":
    case "private_key":
    case "password":
    case "secret":
      return "Credentials";
    case "url":
    case "ip_address":
    case "mac_address":
      return "Network";
    case "order_id":
    case "invoice_id":
      return "Commerce";
    default:
      return "Sensitive Data";
  }
}
