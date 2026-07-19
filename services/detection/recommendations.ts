import type { EntityType } from "./types";

const RECS: Record<EntityType, string> = {
  email:
    "Blur or replace the email with a placeholder (e.g. user@example.com) before sharing publicly.",
  phone:
    "Mask at least the middle digits of the phone number; keep only the last four if needed for support.",
  upi: "Remove or blur the UPI ID entirely before posting screenshots; share payment links privately instead.",
  qr: "Crop out or cover QR codes before sharing; never let others scan payment QR codes from screenshots.",
  credit_card:
    "Delete the screenshot, redact all card digits, and contact your issuer to monitor or reissue the card.",
  debit_card:
    "Redact the full debit card number, rotate the card if shared widely, and avoid storing card images.",
  cvv: "Never share CVV in images; destroy the screenshot and consider card replacement if it left your device.",
  card_expiry:
    "Redact expiry dates alongside any card number; crop the card area from the screenshot.",
  bank_account:
    "Mask the account number leaving at most the last four digits; verify recipients before any transfer.",
  ifsc: "IFSC alone is lower risk, but redact it when shown next to account numbers or beneficiary details.",
  pan: "Fully redact PAN and avoid photographing KYC documents; file a complaint if the image was circulated.",
  aadhaar:
    "Never share Aadhaar screenshots; use offline Aadhaar / masked Aadhaar and revoke virtual IDs if leaked.",
  passport: "Blur the passport number and MRZ; store identity documents in encrypted vaults only.",
  password:
    "Rotate the password immediately, enable MFA, and scrub the screenshot from all synced devices.",
  api_key:
    "Revoke and rotate the key in the provider console now; audit usage logs for unauthorized calls.",
  jwt: "Invalidate the session/token server-side, force re-login, and ensure tokens are never logged or screenshotted.",
  aws_key:
    "Disable the AWS access key in IAM immediately, rotate secrets, and review CloudTrail for abuse.",
  github_token:
    "Revoke the GitHub token, rotate any deployed secrets, and review recent repo/org access logs.",
  private_key:
    "Treat the key as compromised: generate a new keypair, revoke the old one, and rotate dependent certs.",
  secret:
    "Rotate the secret/token, audit access, and use a secrets manager instead of screenshots or chat.",
  url: "Strip query tokens and internal paths; share sanitized links or use expiring share URLs.",
  ip_address: "Redact internal/public IPs from screenshots shared outside your security team.",
  mac_address: "Blur device MACs in network screenshots before posting to forums or tickets.",
  transaction_id:
    "Mask payment reference IDs in public posts; share full refs only with official bank/merchant support.",
  order_id:
    "Replace order IDs with placeholders when sharing receipts outside the merchant portal.",
  invoice_id: "Redact invoice identifiers and amounts before publishing financial screenshots.",
  sensitive:
    "Use a redaction tool to blur sensitive regions, or crop the screenshot to only safe content.",
};

export function recommendFor(type: EntityType): string {
  return RECS[type] ?? RECS.sensitive;
}
