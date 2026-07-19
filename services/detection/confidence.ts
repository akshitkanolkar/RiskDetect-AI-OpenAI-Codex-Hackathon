import type { ContextSignal, EntityType } from "./types";

const BASE_CONFIDENCE: Partial<Record<EntityType, number>> = {
  email: 72,
  upi: 55,
  phone: 60,
  aadhaar: 50,
  pan: 70,
  ifsc: 75,
  credit_card: 55,
  debit_card: 55,
  cvv: 65,
  card_expiry: 50,
  bank_account: 45,
  passport: 55,
  api_key: 85,
  aws_key: 90,
  github_token: 90,
  jwt: 80,
  private_key: 95,
  password: 80,
  secret: 75,
  url: 70,
  ip_address: 65,
  mac_address: 70,
  transaction_id: 60,
  order_id: 65,
  invoice_id: 65,
  qr: 55,
  sensitive: 40,
};

export interface ConfidenceInput {
  type: EntityType;
  validationMethod: string;
  validationDetail?: string;
  context: ContextSignal;
  matchedPattern: string;
}

/**
 * Dynamic confidence from validation strength + context — not hardcoded constants alone.
 */
export function computeConfidence(input: ConfidenceInput): number {
  let score = BASE_CONFIDENCE[input.type] ?? 50;

  const method = input.validationMethod.toLowerCase();
  if (method.includes("verhoeff") || method.includes("luhn")) score += 28;
  if (method.includes("rfc")) score += 22;
  if (method.includes("known upi")) score += 25;
  if (method.includes("upi vpa structure")) score += 8;
  if (method.includes("pan format") || method.includes("ifsc")) score += 18;
  if (
    method.includes("openai") ||
    method.includes("aws") ||
    method.includes("github") ||
    method.includes("stripe")
  ) {
    score += 12;
  }
  if (method.includes("jwt") || method.includes("pem") || method.includes("bearer")) score += 10;
  if (input.validationDetail?.toLowerCase().includes("checksum")) score += 5;
  if (input.validationDetail?.toLowerCase().includes("rejected")) score -= 40;

  score += Math.round(input.context.score * 0.45);

  // Slight penalty for weak extract patterns
  if (input.matchedPattern.includes("broader") || input.type === "bank_account") {
    score -= 5;
  }

  return Math.max(35, Math.min(99, Math.round(score)));
}
