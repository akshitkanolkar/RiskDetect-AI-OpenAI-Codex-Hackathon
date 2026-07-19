import { describe, expect, it } from "vitest";
import {
  buildExecutiveSummary,
  buildSecurityChecklist,
  buildThreatScenarios,
  computePrivacyExposure,
  deriveImageReport,
  personalizeRecommendations,
} from "@/lib/report/derive-intelligence";
import { dedupeFindings } from "@/lib/report/finding-meta";
import type { ImageFinding, ImageScanRecord } from "@/types/scans";

const sampleFindings: ImageFinding[] = [
  {
    id: "1",
    category: "email",
    label: "Email Address",
    value: "support@razorpay.com",
    risk_level: "medium",
    reason: "RFC email validation",
    recommendation: "Blur before sharing",
    confidence: 99,
    start: 0,
    end: 20,
  },
  {
    id: "2",
    category: "upi",
    label: "UPI ID",
    value: "aaravreddy@oksbi",
    risk_level: "high",
    reason: "UPI format",
    recommendation: "Hide before posting",
    confidence: 99,
  },
  {
    id: "2dup",
    category: "upi",
    label: "UPI ID",
    value: "aaravreddy@oksbi",
    risk_level: "high",
    reason: "UPI format",
    recommendation: "Hide before posting",
    confidence: 99,
  },
];

describe("report intelligence", () => {
  it("dedupes identical findings", () => {
    expect(dedupeFindings(sampleFindings)).toHaveLength(2);
  });

  it("builds a non-generic executive summary", () => {
    const summary = buildExecutiveSummary(sampleFindings, "high", 84);
    expect(summary.toLowerCase()).toContain("upi");
    expect(summary).toContain("HIGH");
    expect(summary).not.toMatch(/lorem ipsum/i);
  });

  it("computes privacy axes from findings", () => {
    const privacy = computePrivacyExposure(sampleFindings);
    expect(privacy.financial).toBeGreaterThan(0);
    expect(privacy.communication).toBeGreaterThan(0);
    expect(privacy.overall).toBeGreaterThan(0);
  });

  it("creates threat scenarios for upi and email", () => {
    const scenarios = buildThreatScenarios(sampleFindings, "high");
    expect(scenarios.some((s) => s.id === "upi-fraud")).toBe(true);
    expect(scenarios.some((s) => s.id === "email-phish")).toBe(true);
  });

  it("marks checklist items required when categories present", () => {
    const checklist = buildSecurityChecklist(sampleFindings);
    expect(checklist.find((c) => c.id === "remove-upi")?.required).toBe(true);
    expect(checklist.find((c) => c.id === "blur-email")?.required).toBe(true);
  });

  it("personalizes recommendations with finding values", () => {
    const recs = personalizeRecommendations([], sampleFindings);
    expect(recs.some((r) => r.priority === "immediate")).toBe(true);
    expect(recs.some((r) => r.description.includes("aaravreddy@oksbi"))).toBe(true);
  });

  it("derives a full image report", () => {
    const scan: ImageScanRecord = {
      id: "scan-1",
      user_id: "user-1",
      file_name: "receipt.png",
      mime_type: "image/png",
      file_size: 12000,
      status: "completed",
      risk_level: "high",
      risk_score: 84,
      confidence: 98,
      extracted_text: "support@razorpay.com pay aaravreddy@oksbi",
      findings: sampleFindings,
      recommendations: [],
      ai_explanation: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };
    const report = deriveImageReport(scan);
    expect(report.findings).toHaveLength(2);
    expect(report.timeline).toHaveLength(6);
    expect(report.stats.findings).toBe(2);
  });
});
