import type { EntityType, ValidationResult } from "../types";

const TXN_PATTERNS: Array<{ re: RegExp; type: EntityType; method: string; provider: string }> = [
  {
    re: /^(?:pay_|upi_ref_|UTR)[A-Z0-9]{8,}$/i,
    type: "transaction_id",
    method: "UPI/Payment Reference",
    provider: "UPI",
  },
  {
    re: /^[0-9]{12}$/,
    type: "transaction_id",
    method: "UPI Reference Number",
    provider: "UPI",
  },
  {
    re: /^(?:ORD|ORDER)[-_]?[A-Z0-9]{6,}$/i,
    type: "order_id",
    method: "Ecommerce Order ID",
    provider: "Order",
  },
  {
    re: /^(?:INV|INVOICE)[-_]?[A-Z0-9]{4,}$/i,
    type: "invoice_id",
    method: "Invoice ID",
    provider: "Invoice",
  },
  {
    re: /^(?:rzp_|order_)[A-Za-z0-9]{10,}$/i,
    type: "transaction_id",
    method: "Razorpay ID",
    provider: "Razorpay",
  },
  {
    re: /^(?:pi_|ch_|txn_)[A-Za-z0-9]{10,}$/i,
    type: "transaction_id",
    method: "Payment Provider ID",
    provider: "Stripe/Payments",
  },
];

export function validateTransactionId(
  value: string,
  nearPaymentContext: boolean,
):
  (ValidationResult & { type?: EntityType; provider?: string }) | { valid: false; method: string } {
  const trimmed = value.trim();
  for (const p of TXN_PATTERNS) {
    if (!p.re.test(trimmed)) continue;
    // Bare 12-digit UPI refs need payment context to avoid phone/aadhaar collision
    if (p.method === "UPI Reference Number" && !nearPaymentContext) {
      continue;
    }
    return {
      valid: true,
      method: p.method,
      normalizedValue: trimmed,
      type: p.type,
      provider: p.provider,
      detail: p.provider,
    };
  }
  return { valid: false, method: "Transaction Patterns" };
}
