import {
  CreditCard,
  Fingerprint,
  Globe,
  Hash,
  KeyRound,
  Mail,
  Network,
  Phone,
  QrCode,
  Receipt,
  ShieldAlert,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { FindingCategory, ImageFinding } from "@/types/scans";
import type { RiskLevel } from "@/types";

export const RISK_RANK: Record<RiskLevel, number> = {
  safe: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export const SEVERITY_COLORS: Record<RiskLevel, string> = {
  critical: "hsl(var(--risk-critical))",
  high: "hsl(var(--risk-high))",
  medium: "hsl(var(--risk-medium))",
  low: "hsl(var(--risk-low))",
  safe: "hsl(var(--risk-safe))",
};

const CATEGORY_ICONS: Partial<Record<FindingCategory, LucideIcon>> = {
  email: Mail,
  phone: Phone,
  upi: Wallet,
  qr: QrCode,
  credit_card: CreditCard,
  debit_card: CreditCard,
  cvv: CreditCard,
  card_expiry: CreditCard,
  bank_account: Wallet,
  ifsc: Hash,
  pan: Fingerprint,
  aadhaar: Fingerprint,
  passport: Fingerprint,
  password: KeyRound,
  api_key: KeyRound,
  jwt: KeyRound,
  aws_key: KeyRound,
  github_token: KeyRound,
  private_key: KeyRound,
  secret: KeyRound,
  url: Globe,
  ip_address: Network,
  mac_address: Network,
  transaction_id: Receipt,
  order_id: Receipt,
  invoice_id: Receipt,
  sensitive: ShieldAlert,
};

export function getFindingIcon(category: FindingCategory): LucideIcon {
  return CATEGORY_ICONS[category] ?? ShieldAlert;
}

export function formatFindingValue(value: string, hidden: boolean): string {
  if (!hidden) return value;
  if (value.length <= 4) return "••••";
  return `${"•".repeat(Math.min(value.length - 4, 12))}${value.slice(-4)}`;
}

export function dedupeFindings(findings: ImageFinding[]): ImageFinding[] {
  const seen = new Set<string>();
  return findings.filter((finding) => {
    const key = `${finding.category}:${finding.value.toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function countBySeverity(findings: ImageFinding[]): Record<RiskLevel, number> {
  const counts: Record<RiskLevel, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    safe: 0,
  };
  for (const finding of findings) {
    counts[finding.risk_level] += 1;
  }
  return counts;
}

export function countByCategory(findings: ImageFinding[]): Array<{ name: string; count: number }> {
  const map = new Map<string, number>();
  for (const finding of findings) {
    const label = finding.label || finding.category;
    map.set(label, (map.get(label) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function isSensitiveCategory(category: FindingCategory): boolean {
  return !["url", "ip_address", "mac_address", "transaction_id", "order_id", "invoice_id"].includes(
    category,
  );
}

export function isThreatCategory(category: FindingCategory): boolean {
  return [
    "password",
    "api_key",
    "jwt",
    "aws_key",
    "github_token",
    "private_key",
    "secret",
    "credit_card",
    "debit_card",
    "cvv",
    "aadhaar",
    "pan",
    "passport",
  ].includes(category);
}

export function learnMoreUrl(category: FindingCategory): string {
  const map: Partial<Record<FindingCategory, string>> = {
    email:
      "https://owasp.org/www-community/vulnerabilities/Information_exposure_through_query_strings_in_url",
    phone: "https://www.cisa.gov/news-events/news/protecting-personal-information",
    upi: "https://www.rbi.org.in/Scripts/FAQView.aspx?Id=130",
    aadhaar:
      "https://uidai.gov.in/en/contact-support/have-any-question/284-faqs/your-aadhaar/aadhaar-security.html",
    pan: "https://www.incometax.gov.in/iec/foportal/help/how-to-apply-pan",
    credit_card: "https://www.pcisecuritystandards.org/",
    password: "https://owasp.org/www-community/vulnerabilities/Password_Plaintext_Storage",
    api_key: "https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_cryptographic_key",
  };
  return map[category] ?? "https://owasp.org/www-project-top-ten/";
}
