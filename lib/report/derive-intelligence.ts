import type {
  FindingCategory,
  ImageFinding,
  ImageScanRecord,
  Recommendation,
  TimelineEvent,
  UrlScanRecord,
} from "@/types/scans";
import type { RiskLevel } from "@/types";
import {
  countByCategory,
  countBySeverity,
  dedupeFindings,
  isSensitiveCategory,
  isThreatCategory,
  RISK_RANK,
} from "@/lib/report/finding-meta";

export interface PrivacyExposure {
  identity: number;
  financial: number;
  credentials: number;
  communication: number;
  overall: number;
}

export interface ThreatScenario {
  id: string;
  title: string;
  description: string;
  likelihood: RiskLevel;
  probability: number;
}

export interface ChecklistItem {
  id: string;
  label: string;
  category: FindingCategory | "general";
  completed: boolean;
  required: boolean;
}

export interface ReportStats {
  findings: number;
  sensitive: number;
  threats: number;
  avgConfidence: number;
  processingMs: number;
  wordsExtracted: number;
  model: string;
}

export interface DerivedImageReport {
  findings: ImageFinding[];
  severityBreakdown: Array<{ name: string; value: number; level: RiskLevel }>;
  entityBreakdown: Array<{ name: string; count: number }>;
  privacy: PrivacyExposure;
  scenarios: ThreatScenario[];
  checklist: ChecklistItem[];
  recommendations: Recommendation[];
  timeline: TimelineEvent[];
  stats: ReportStats;
  executiveSummary: string;
}

export interface DerivedUrlReport {
  privacy: PrivacyExposure;
  scenarios: ThreatScenario[];
  checklist: ChecklistItem[];
  recommendations: Recommendation[];
  timeline: TimelineEvent[];
  stats: ReportStats;
  executiveSummary: string;
  signalCards: Array<{
    id: string;
    title: string;
    detail: string;
    severity: RiskLevel;
  }>;
}

const IDENTITY: FindingCategory[] = ["aadhaar", "pan", "passport", "sensitive"];
const FINANCIAL: FindingCategory[] = [
  "upi",
  "credit_card",
  "debit_card",
  "cvv",
  "card_expiry",
  "bank_account",
  "ifsc",
  "transaction_id",
  "order_id",
  "invoice_id",
  "qr",
];
const CREDENTIALS: FindingCategory[] = [
  "password",
  "api_key",
  "jwt",
  "aws_key",
  "github_token",
  "private_key",
  "secret",
];
const COMMUNICATION: FindingCategory[] = ["email", "phone", "url", "ip_address", "mac_address"];

function scoreAxis(findings: ImageFinding[], categories: FindingCategory[], weight = 22): number {
  const matched = findings.filter((f) => categories.includes(f.category));
  if (!matched.length) return 0;
  const severityBoost = matched.reduce((sum, f) => sum + RISK_RANK[f.risk_level] * 8, 0);
  return Math.min(100, matched.length * weight + severityBoost);
}

export function computePrivacyExposure(findings: ImageFinding[]): PrivacyExposure {
  const identity = scoreAxis(findings, IDENTITY, 28);
  const financial = scoreAxis(findings, FINANCIAL, 24);
  const credentials = scoreAxis(findings, CREDENTIALS, 32);
  const communication = scoreAxis(findings, COMMUNICATION, 18);
  const overall = Math.round(
    identity * 0.25 + financial * 0.35 + credentials * 0.25 + communication * 0.15,
  );
  return { identity, financial, credentials, communication, overall };
}

function uniqueLabels(findings: ImageFinding[]): string[] {
  return Array.from(new Set(findings.map((f) => f.label.toLowerCase())));
}

export function buildExecutiveSummary(
  findings: ImageFinding[],
  riskLevel: RiskLevel,
  riskScore: number,
  aiExplanation?: string,
): string {
  if (aiExplanation?.trim() && aiExplanation.trim().length > 80) {
    const trimmed = aiExplanation.trim();
    if (!/overall risk/i.test(trimmed)) {
      return `${trimmed}${trimmed.endsWith(".") ? "" : "."} Overall risk is classified as ${riskLevel.toUpperCase()} (${riskScore}/100).`;
    }
    return trimmed;
  }

  if (!findings.length) {
    return `No validated sensitive entities were confirmed in this scan. Residual risk remains ${riskLevel.toUpperCase()} (${riskScore}/100) based on contextual signals—still verify that nothing was cropped out of frame before sharing.`;
  }

  const labels = uniqueLabels(findings);
  const list =
    labels.length === 1
      ? labels[0]
      : labels.length === 2
        ? `${labels[0]} and ${labels[1]}`
        : `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;

  const hasGovId = findings.some((f) => ["aadhaar", "pan", "passport"].includes(f.category));
  const hasPayment = findings.some((f) =>
    ["upi", "credit_card", "debit_card", "bank_account", "qr"].includes(f.category),
  );
  const hasCreds = findings.some(
    (f) => isThreatCategory(f.category) && CREDENTIALS.includes(f.category),
  );

  const impactParts: string[] = [];
  if (hasPayment) {
    impactParts.push(
      "payment identifiers could invite fraudulent requests or account takeover attempts",
    );
  }
  if (hasGovId) {
    impactParts.push("government identity numbers sharply raise identity-theft exposure");
  }
  if (hasCreds) {
    impactParts.push("exposed credentials or API secrets can enable immediate unauthorized access");
  }
  if (!impactParts.length) {
    impactParts.push(
      "harvested contact details can fuel phishing, spam, and social-engineering campaigns",
    );
  }

  return `This capture exposes ${findings.length} validated finding${findings.length === 1 ? "" : "s"} spanning ${list}. ${impactParts.join("; ").replace(/^./, (c) => c.toUpperCase())}. Overall risk is classified as ${riskLevel.toUpperCase()} (${riskScore}/100).`;
}

export function buildThreatScenarios(
  findings: ImageFinding[],
  riskLevel: RiskLevel,
): ThreatScenario[] {
  const scenarios: ThreatScenario[] = [];
  const has = (cat: FindingCategory | FindingCategory[]) =>
    findings.some((f) => (Array.isArray(cat) ? cat.includes(f.category) : f.category === cat));

  if (has("upi")) {
    scenarios.push({
      id: "upi-fraud",
      title: "Fraudulent UPI payment requests",
      description:
        "An attacker can send spoofed collect requests to the exposed UPI ID, hoping the owner approves under social pressure or confusion.",
      likelihood: "high",
      probability: 78,
    });
  }
  if (has("email")) {
    scenarios.push({
      id: "email-phish",
      title: "Targeted phishing against exposed addresses",
      description:
        "Public emails are routinely scraped for spear-phishing. Attackers personalize lures using context visible in the same screenshot.",
      likelihood: "medium",
      probability: 64,
    });
  }
  if (has("phone")) {
    scenarios.push({
      id: "sim-swap",
      title: "SIM-swap and voice social engineering",
      description:
        "Phone numbers enable OTP interception attempts and pretexting calls that impersonate banks or delivery services.",
      likelihood: "medium",
      probability: 58,
    });
  }
  if (has(["aadhaar", "pan", "passport"])) {
    scenarios.push({
      id: "identity-theft",
      title: "Identity document abuse",
      description:
        "Government IDs combined with contact details accelerate fraudulent KYC, loan applications, and account openings.",
      likelihood: "critical",
      probability: 86,
    });
  }
  if (has(["credit_card", "debit_card", "cvv"])) {
    scenarios.push({
      id: "card-fraud",
      title: "Card-not-present fraud",
      description:
        "Visible PAN, expiry, or CVV fragments can be sold or used for unauthorized online purchases.",
      likelihood: "critical",
      probability: 90,
    });
  }
  if (has(CREDENTIALS)) {
    scenarios.push({
      id: "credential-abuse",
      title: "Credential and secret abuse",
      description:
        "Leaked passwords, tokens, or API keys can be replayed immediately against production systems or personal accounts.",
      likelihood: "critical",
      probability: 92,
    });
  }
  if (has(["transaction_id", "order_id", "invoice_id"])) {
    scenarios.push({
      id: "receipt-pretext",
      title: "Receipt-based pretexting",
      description:
        "Transaction identifiers help scammers craft believable support or refund narratives referencing a real purchase.",
      likelihood: "low",
      probability: 42,
    });
  }

  if (!scenarios.length) {
    scenarios.push({
      id: "residual",
      title: "Opportunistic reconnaissance",
      description:
        "Even without high-value PII, screenshot metadata and layout cues can help attackers profile sharing habits for later campaigns.",
      likelihood: riskLevel === "safe" ? "low" : riskLevel,
      probability: Math.max(18, RISK_RANK[riskLevel] * 18),
    });
  }

  return scenarios.slice(0, 4);
}

const CHECKLIST_DEFS: Array<{ id: string; label: string; categories: FindingCategory[] }> = [
  { id: "blur-email", label: "Blur email addresses", categories: ["email"] },
  { id: "hide-phone", label: "Mask phone numbers", categories: ["phone"] },
  { id: "remove-qr", label: "Remove QR codes", categories: ["qr"] },
  { id: "remove-upi", label: "Remove UPI IDs", categories: ["upi"] },
  {
    id: "remove-account",
    label: "Remove bank account numbers",
    categories: ["bank_account", "ifsc"],
  },
  { id: "remove-aadhaar", label: "Remove Aadhaar numbers", categories: ["aadhaar"] },
  { id: "remove-pan", label: "Remove PAN numbers", categories: ["pan"] },
  {
    id: "remove-cards",
    label: "Redact card numbers & CVV",
    categories: ["credit_card", "debit_card", "cvv", "card_expiry"],
  },
  {
    id: "remove-secrets",
    label: "Remove passwords & API secrets",
    categories: CREDENTIALS,
  },
];

export function buildSecurityChecklist(findings: ImageFinding[]): ChecklistItem[] {
  const present = new Set(findings.map((f) => f.category));
  const items = CHECKLIST_DEFS.map((def) => {
    const required = def.categories.some((c) => present.has(c));
    return {
      id: def.id,
      label: def.label,
      category: def.categories[0],
      required,
      completed: !required,
    };
  });

  if (!findings.length) {
    return [
      {
        id: "verify-crop",
        label: "Confirm no sensitive edges were cropped out",
        category: "general",
        required: true,
        completed: false,
      },
      ...items.filter((i) => !i.required).slice(0, 3),
    ];
  }

  return items.sort((a, b) => Number(b.required) - Number(a.required));
}

export function personalizeRecommendations(
  base: Recommendation[],
  findings: ImageFinding[],
): Recommendation[] {
  const generated: Recommendation[] = [];
  const byCat = new Map<FindingCategory, ImageFinding>();
  for (const f of findings) {
    if (!byCat.has(f.category)) byCat.set(f.category, f);
  }

  const push = (
    id: string,
    title: string,
    description: string,
    priority: Recommendation["priority"],
  ) => {
    if (!generated.some((g) => g.id === id) && !base.some((b) => b.id === id)) {
      generated.push({ id, title, description, priority });
    }
  };

  for (const [category, finding] of byCat) {
    if (category === "upi") {
      push(
        "imm-upi",
        "Remove visible UPI ID",
        `Redact “${finding.value}” entirely before posting—collect requests can hit this handle within minutes of exposure.`,
        "immediate",
      );
    } else if (category === "phone") {
      push(
        "imm-phone",
        "Mask phone number",
        `Keep only the last four digits of ${finding.value}; full numbers enable spam and SIM-swap pretexting.`,
        "immediate",
      );
    } else if (category === "email") {
      push(
        "imm-email",
        "Blur email address",
        `Hide ${finding.value} before public sharing—address harvesting feeds phishing lists.`,
        "immediate",
      );
    } else if (["aadhaar", "pan", "passport"].includes(category)) {
      push(
        "imm-id",
        `Remove ${finding.label}`,
        `${finding.label} values must never appear in shared screenshots. Delete or heavily blur before any distribution.`,
        "immediate",
      );
    } else if (CREDENTIALS.includes(category)) {
      push(
        "imm-secret",
        "Rotate exposed secret immediately",
        `Treat “${finding.label}” as compromised: revoke, rotate, and audit access logs before sharing anything else.`,
        "immediate",
      );
    } else if (["credit_card", "debit_card", "cvv"].includes(category)) {
      push(
        "imm-card",
        "Redact payment card data",
        "Mask the full card number and never leave CVV or expiry visible in receipts shared online.",
        "immediate",
      );
    }
  }

  if (findings.some((f) => FINANCIAL.includes(f.category))) {
    push(
      "soon-receipts",
      "Avoid posting payment receipts",
      "Receipts often combine merchant, amount, and identifiers that make social-engineering stories believable.",
      "soon",
    );
  }
  if (findings.some((f) => ["transaction_id", "order_id", "invoice_id"].includes(f.category))) {
    push(
      "soon-txn",
      "Remove transaction identifiers",
      "Strip order and invoice IDs unless the recipient absolutely needs them for support.",
      "soon",
    );
  }

  push(
    "opt-crop",
    "Crop unnecessary metadata",
    "Trim status bars, notification previews, and unrelated UI chrome that leak device or account context.",
    "optional",
  );

  const merged = [...generated, ...base];
  const order = { immediate: 0, soon: 1, optional: 2 } as const;
  return merged.sort((a, b) => order[a.priority] - order[b.priority]).slice(0, 9);
}

function estimateProcessingMs(scan: ImageScanRecord | UrlScanRecord): number {
  if ("findings" in scan) {
    const base = 900;
    const perFinding = scan.findings.length * 120;
    const textFactor = Math.min(1200, (scan.extracted_text?.length ?? 0) / 4);
    return Math.round(base + perFinding + textFactor);
  }
  return Math.round(1100 + scan.reasons.length * 90 + (scan.signals.heuristicScore / 100) * 400);
}

function buildImageTimeline(scan: ImageScanRecord, processingMs: number): TimelineEvent[] {
  const start = new Date(scan.created_at).getTime() - processingMs;
  const step = Math.max(180, Math.floor(processingMs / 5));
  const stamps = [0, step, step * 2, step * 3, step * 4, processingMs].map((offset) =>
    new Date(start + offset).toISOString(),
  );

  return [
    {
      id: "upload",
      label: "Upload",
      detail: `Received ${scan.file_name} (${formatBytes(scan.file_size)}).`,
      status: "info",
      at: stamps[0],
    },
    {
      id: "ocr",
      label: "OCR",
      detail: "Optical character recognition extracted on-screen text.",
      status: "success",
      at: stamps[1],
    },
    {
      id: "validation",
      label: "Validation",
      detail: "Entity validators confirmed format, checksums, and context.",
      status: "success",
      at: stamps[2],
    },
    {
      id: "classification",
      label: "Classification",
      detail: `Mapped ${scan.findings.length} finding(s) to risk categories.`,
      status: scan.findings.length ? "warning" : "success",
      at: stamps[3],
    },
    {
      id: "ai",
      label: "AI Analysis",
      detail: "Risk synthesis produced score, summary, and recommendations.",
      status: "info",
      at: stamps[4],
    },
    {
      id: "done",
      label: "Completed",
      detail: `Report ready · ${scan.risk_level.toUpperCase()} (${scan.risk_score}/100).`,
      status: scan.risk_level === "critical" || scan.risk_level === "high" ? "danger" : "success",
      at: stamps[5],
    },
  ];
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} seconds`;
}

export function deriveImageReport(scan: ImageScanRecord): DerivedImageReport {
  const findings = dedupeFindings(scan.findings);
  const severityCounts = countBySeverity(findings);
  const severityBreakdown = (Object.keys(severityCounts) as RiskLevel[])
    .filter((level) => severityCounts[level] > 0)
    .map((level) => ({
      name: level.charAt(0).toUpperCase() + level.slice(1),
      value: severityCounts[level],
      level,
    }));

  const processingMs = estimateProcessingMs(scan);
  const confidences = findings.map((f) => f.confidence ?? scan.confidence);
  const avgConfidence = confidences.length
    ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length)
    : scan.confidence;

  return {
    findings,
    severityBreakdown,
    entityBreakdown: countByCategory(findings),
    privacy: computePrivacyExposure(findings),
    scenarios: buildThreatScenarios(findings, scan.risk_level),
    checklist: buildSecurityChecklist(findings),
    recommendations: personalizeRecommendations(scan.recommendations, findings),
    timeline: buildImageTimeline(scan, processingMs),
    stats: {
      findings: findings.length,
      sensitive: findings.filter((f) => isSensitiveCategory(f.category)).length,
      threats: findings.filter((f) => isThreatCategory(f.category)).length,
      avgConfidence,
      processingMs,
      wordsExtracted: scan.extracted_text
        ? scan.extracted_text.trim().split(/\s+/).filter(Boolean).length
        : 0,
      model: "RiskDetect Vision · GPT risk synthesis",
    },
    executiveSummary: buildExecutiveSummary(
      findings,
      scan.risk_level,
      scan.risk_score,
      scan.ai_explanation,
    ),
  };
}

export function deriveUrlReport(scan: UrlScanRecord): DerivedUrlReport {
  const processingMs = estimateProcessingMs(scan);
  const signalCards: DerivedUrlReport["signalCards"] = [];

  if (scan.protocol !== "https") {
    signalCards.push({
      id: "proto",
      title: "Insecure protocol",
      detail: "Non-HTTPS traffic can be intercepted or altered in transit.",
      severity: "high",
    });
  }
  if (scan.signals.hasHomoglyph) {
    signalCards.push({
      id: "homo",
      title: "Homoglyph / brand impersonation",
      detail: "Domain characters may mimic a trusted brand to deceive users.",
      severity: "critical",
    });
  }
  if (scan.signals.isTyposquat) {
    signalCards.push({
      id: "typo",
      title: "Typosquatting",
      detail: scan.signals.matchedBrand
        ? `Lookalike domain imitating ${scan.signals.matchedBrand}${scan.signals.officialDomain ? ` (official: ${scan.signals.officialDomain})` : ""}.`
        : "Registrable label is a close edit-distance match to a trusted brand.",
      severity: "critical",
    });
  } else if (scan.signals.isBrandImpersonation) {
    signalCards.push({
      id: "brand",
      title: "Brand impersonation",
      detail: scan.signals.officialDomain
        ? `Appears to impersonate ${scan.signals.matchedBrand}. Prefer ${scan.signals.officialDomain}.`
        : "Domain closely resembles a trusted brand but is not official.",
      severity: "critical",
    });
  }
  if (scan.signals.isShortened) {
    signalCards.push({
      id: "short",
      title: "Shortened URL",
      detail: "Destination cannot be verified without expanding the short link.",
      severity: "medium",
    });
  }
  if (scan.signals.hasDeepSubdomains) {
    signalCards.push({
      id: "subs",
      title: "Excessive subdomains",
      detail: "Unusually deep subdomain nesting is common in phishing kits.",
      severity: "medium",
    });
  }
  if (scan.signals.hasSuspiciousTld) {
    signalCards.push({
      id: "tld",
      title: "Suspicious TLD + impersonation",
      detail: `Uncommon TLD${scan.signals.tld ? ` (.${scan.signals.tld})` : ""} combined with brand lookalike signals.`,
      severity: "high",
    });
  }
  if (scan.signals.hasIpHost) {
    signalCards.push({
      id: "ip",
      title: "Raw IP host",
      detail: "Legitimate services rarely expose bare IPs in consumer links.",
      severity: "high",
    });
  }
  if (scan.signals.listedInUrlhaus || scan.signals.listedInOpenPhish) {
    signalCards.push({
      id: "feed",
      title: "Listed in threat intelligence",
      detail: "This URL appears in active malware or phishing blocklists.",
      severity: "critical",
    });
  }
  if (scan.signals.suspiciousKeywords.length) {
    signalCards.push({
      id: "kw",
      title: "Suspicious keywords",
      detail: `Matched: ${scan.signals.suspiciousKeywords.join(", ")}.`,
      severity: "medium",
    });
  }
  if (scan.signals.domainAgeDays != null && scan.signals.domainAgeDays < 30) {
    signalCards.push({
      id: "age",
      title: "Very new domain",
      detail: `Registered roughly ${scan.signals.domainAgeDays} day(s) ago—common in phishing campaigns.`,
      severity: "medium",
    });
  }

  for (const reason of scan.reasons) {
    if (signalCards.length >= 6) break;
    if (signalCards.some((c) => c.detail === reason || c.title === reason)) continue;
    signalCards.push({
      id: `reason-${signalCards.length}`,
      title: "Heuristic signal",
      detail: reason,
      severity: scan.risk_level === "safe" ? "low" : scan.risk_level,
    });
  }

  const scenarios: ThreatScenario[] = [
    {
      id: "click",
      title: "Credential harvesting on visit",
      description: `Users landing on ${scan.domain} may be prompted for passwords or OTPs on a cloned login page.`,
      likelihood: scan.risk_level === "safe" ? "low" : scan.risk_level,
      probability: Math.min(95, Math.max(20, scan.risk_score)),
    },
    {
      id: "malware",
      title: "Drive-by malware or tracking payload",
      description:
        "Malicious landing pages can deliver scripts that fingerprint devices or trigger unwanted downloads.",
      likelihood: scan.signals.listedInUrlhaus ? "critical" : "medium",
      probability: scan.signals.listedInUrlhaus ? 88 : 45,
    },
    {
      id: "share",
      title: "Secondary propagation",
      description:
        "Forwarding this link through chat or email expands the blast radius to contacts who trust the sender.",
      likelihood: "medium",
      probability: 55,
    },
  ];

  const timeline =
    scan.timeline.length > 0
      ? scan.timeline
      : [
          {
            id: "validate",
            label: "Validated URL",
            detail: "Syntax and hostname structure parsed successfully.",
            status: "success" as const,
            at: scan.created_at,
          },
          {
            id: "feeds",
            label: "Threat feeds",
            detail: "Checked URLHaus and OpenPhish listings.",
            status: "info" as const,
            at: scan.created_at,
          },
          {
            id: "ai",
            label: "AI Analysis",
            detail: "Synthesized score, category, and guidance.",
            status: "info" as const,
            at: scan.updated_at,
          },
          {
            id: "done",
            label: "Completed",
            detail: `${scan.threat_category} · ${scan.risk_level.toUpperCase()}`,
            status:
              scan.risk_level === "critical" || scan.risk_level === "high"
                ? ("danger" as const)
                : ("success" as const),
            at: scan.updated_at,
          },
        ];

  const checklist: ChecklistItem[] = [
    {
      id: "dont-visit",
      label: "Do not open the link from untrusted sources",
      category: "general",
      required: RISK_RANK[scan.risk_level] >= 2,
      completed: RISK_RANK[scan.risk_level] < 2,
    },
    {
      id: "verify-domain",
      label: "Verify the domain against official bookmarks",
      category: "general",
      required: true,
      completed: false,
    },
    {
      id: "https",
      label: "Prefer HTTPS-only destinations",
      category: "general",
      required: scan.protocol !== "https",
      completed: scan.protocol === "https",
    },
    {
      id: "report",
      label: "Report phishing to your security team if confirmed",
      category: "general",
      required: RISK_RANK[scan.risk_level] >= 3,
      completed: false,
    },
  ];

  return {
    privacy: {
      identity:
        scan.signals.hasHomoglyph || scan.signals.isTyposquat || scan.signals.isBrandImpersonation
          ? 70
          : 20,
      financial: scan.threat_category.toLowerCase().includes("phish") ? 65 : 25,
      credentials: Math.min(100, Math.round(scan.risk_score * 0.85)),
      communication: 40,
      overall: scan.risk_score,
    },
    scenarios,
    checklist,
    recommendations: scan.recommendations,
    timeline,
    stats: {
      findings: signalCards.length,
      sensitive: signalCards.filter((s) => RISK_RANK[s.severity] >= 2).length,
      threats: signalCards.filter((s) => RISK_RANK[s.severity] >= 3).length,
      avgConfidence: scan.confidence,
      processingMs,
      wordsExtracted: 0,
      model: "RiskDetect URL Intel · GPT risk synthesis",
    },
    executiveSummary:
      scan.ai_explanation?.trim().length > 40
        ? scan.ai_explanation
        : `Analysis of ${scan.normalized_url} indicates ${scan.threat_category.toLowerCase()} with an overall risk of ${scan.risk_level.toUpperCase()} (${scan.risk_score}/100). ${scan.reasons[0] ?? "Review signals carefully before visiting."}`,
    signalCards,
  };
}
