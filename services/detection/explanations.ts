import type { EntityType } from "./types";

const EXPLANATIONS: Record<EntityType, (value: string) => string> = {
  email: (v) =>
    `This email address (${v}) may expose personal or organizational identity and could be harvested for phishing or spam campaigns.`,
  phone: (v) =>
    `This phone number (${v}) can enable SIM-swap attempts, OTP interception social engineering, and unsolicited contact.`,
  upi: (v) =>
    `Publicly exposing the UPI ID (${v}) increases the risk of unsolicited payment requests and targeted financial fraud.`,
  qr: () =>
    `QR or payment-code references in screenshots can redirect scanners to phishing pages or unintended payment flows.`,
  credit_card: (v) =>
    `A payment card number (${mask(v)}) that passes Luhn validation is high-value financial PII and can enable unauthorized charges if combined with other card data.`,
  debit_card: (v) =>
    `A debit card number (${mask(v)}) linked to a bank account heightens direct fund-theft risk if shared outside secure channels.`,
  cvv: () =>
    `A CVV/CVC near card context is a card-not-present authentication factor; exposure enables fraudulent online transactions.`,
  card_expiry: (v) =>
    `Card expiry (${v}) alongside other card fields completes data needed for many card-not-present fraud attempts.`,
  bank_account: (v) =>
    `A bank account number (${mask(v)}) in a screenshot can be abused for unauthorized debit instructions or social-engineering of bank staff.`,
  ifsc: (v) =>
    `An IFSC code (${v}) identifies a specific bank branch and, paired with an account number, enables precise payment targeting.`,
  pan: (v) =>
    `PAN (${v}) is sensitive Indian tax identity data; leakage enables identity theft and fraudulent KYC submissions.`,
  aadhaar: (v) =>
    `Aadhaar (${mask(v)}) that passes Verhoeff validation is highly sensitive national identity data and must never be shared in screenshots.`,
  passport: (v) =>
    `Passport number (${v}) is travel identity PII that can be abused for impersonation and travel-related fraud.`,
  password: () =>
    `Explicit password text in a screenshot is an immediate credential compromise indicator and should trigger rotation.`,
  api_key: (v) =>
    `An API key (${mask(v)}) can grant billed or privileged access to cloud/AI services if anyone with the screenshot can reuse it.`,
  jwt: () =>
    `A JWT session/access token can allow impersonation of the authenticated user until the token expires or is revoked.`,
  aws_key: (v) =>
    `An AWS access key ID (${v}) strongly suggests cloud credential exposure; paired secrets enable full account takeover.`,
  github_token: () =>
    `A GitHub token can grant repository, package, or org access and is a common source of supply-chain compromise.`,
  private_key: () =>
    `A PEM private key block in a screenshot is critical cryptographic material; anyone who copies it can decrypt or impersonate services.`,
  secret: () =>
    `An authentication secret or bearer credential in OCR text should be treated as compromised until rotated.`,
  url: (v) =>
    `This URL (${truncate(v)}) may leak internal paths, tokens in query strings, or link to malicious destinations when shared.`,
  ip_address: (v) =>
    `An IP address (${v}) can reveal network topology or home/office infrastructure useful for reconnaissance.`,
  mac_address: (v) =>
    `A MAC address (${v}) can fingerprint a device and aid network targeting or asset tracking.`,
  transaction_id: (v) =>
    `A payment transaction/reference ID (${v}) can be used in social-engineering calls to banks or merchants to authorize refunds/disputes.`,
  order_id: (v) =>
    `An order ID (${v}) can expose purchase history and enable account takeover attempts against ecommerce support desks.`,
  invoice_id: (v) =>
    `An invoice ID (${v}) may reveal billing relationships and can be abused in invoice-fraud or BEC-style attacks.`,
  sensitive: (v) =>
    `Sensitive content (${truncate(v)}) was detected and may pose privacy or compliance risk if the screenshot is shared.`,
};

function mask(value: string): string {
  const d = value.replace(/\s/g, "");
  if (d.length <= 4) return "****";
  return `${"*".repeat(Math.min(8, d.length - 4))}${d.slice(-4)}`;
}

function truncate(value: string, max = 48): string {
  return value.length <= max ? value : `${value.slice(0, max)}…`;
}

export function explainFinding(type: EntityType, value: string): string {
  const fn = EXPLANATIONS[type] ?? EXPLANATIONS.sensitive;
  return fn(value);
}

const LABELS: Partial<Record<EntityType, string>> = {
  email: "Email Address",
  phone: "Phone Number",
  upi: "UPI ID",
  qr: "QR / Payment Code",
  credit_card: "Credit Card",
  debit_card: "Debit Card",
  cvv: "CVV / CVC",
  card_expiry: "Card Expiry",
  bank_account: "Bank Account Number",
  ifsc: "IFSC Code",
  pan: "PAN",
  aadhaar: "Aadhaar",
  passport: "Passport Number",
  password: "Password",
  api_key: "API Key",
  jwt: "JWT Token",
  aws_key: "AWS Access Key",
  github_token: "GitHub Token",
  private_key: "Private Key",
  secret: "Secret / Bearer Token",
  url: "URL",
  ip_address: "IP Address",
  mac_address: "MAC Address",
  transaction_id: "Transaction ID",
  order_id: "Order ID",
  invoice_id: "Invoice ID",
  sensitive: "Sensitive Data",
};

export function labelFor(type: EntityType): string {
  return LABELS[type] ?? "Sensitive Data";
}
