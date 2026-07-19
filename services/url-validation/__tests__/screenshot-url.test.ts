import { describe, expect, it } from "vitest";
import {
  analyzeScreenshotUrls,
  applyUrlRiskFloor,
  extractUrlsFromOcrText,
  healOcrUrlText,
  mergeUrlFindings,
} from "@/services/url-validation";
import { runDetectionPipeline } from "@/services/detection";
import type { ImageFinding } from "@/types/scans";

describe("OCR URL healing & extraction", () => {
  it("heals spaced hosts into a parseable URL", () => {
    const healed = healOcrUrlText("Visit https://login .rnicrosoft.com/security/verify now");
    expect(healed).toContain("https://login.rnicrosoft.com/security/verify");
  });

  it("heals broken https scheme", () => {
    const healed = healOcrUrlText("Open htt ps://rnicrosoft.com/login");
    expect(healed.toLowerCase()).toContain("https://rnicrosoft.com/login");
  });

  it("extracts scheme-less phishing domains", () => {
    const urls = extractUrlsFromOcrText("Go to login.rnicrosoft.com/security/verify immediately");
    expect(urls.length).toBeGreaterThan(0);
    expect(urls.some((u) => u.normalized.includes("rnicrosoft.com"))).toBe(true);
  });

  it("strips trailing punctuation from URLs", () => {
    const urls = extractUrlsFromOcrText("See https://rnicrosoft.com/login.");
    expect(urls[0]?.normalized).toMatch(/rnicrosoft\.com\/login\/?$/);
  });
});

describe("Screenshot URL analyzer — phishing must not be SAFE", () => {
  it("flags login.rnicrosoft.com/security/verify as critical/high", async () => {
    const text = "Please verify at https://login.rnicrosoft.com/security/verify";
    const result = await analyzeScreenshotUrls(text);
    expect(result.urlFindings.length).toBeGreaterThan(0);
    const finding = result.urlFindings[0]!;
    expect(["critical", "high"]).toContain(finding.risk_level);
    expect(result.riskFloor).toBeGreaterThanOrEqual(75);
    expect(finding.reason.toLowerCase()).toMatch(/microsoft|rn|typosquat|imitate/);
    expect(finding.recommendation.toLowerCase()).toMatch(/official|credential|avoid/);
  });

  it("flags OCR-broken rnicrosoft URL", async () => {
    const text = "Click https://login .rnicrosoft.com/security/verify to continue";
    const result = await analyzeScreenshotUrls(text);
    expect(result.urlFindings.some((f) => /rnicrosoft/i.test(f.value))).toBe(true);
    expect(["critical", "high"]).toContain(result.maxUrlRisk);
  });

  it("flags scheme-less rnicrosoft domain", async () => {
    const result = await analyzeScreenshotUrls(
      "Account alert: login.rnicrosoft.com/security/verify",
    );
    expect(result.urlFindings.length).toBeGreaterThan(0);
    expect(["critical", "high"]).toContain(result.maxUrlRisk);
  });

  it.each([
    "https://githhub.com",
    "https://goog1e.com",
    "https://amaz0n.com",
    "https://paypaI.com",
    "https://rnicrosoft.com",
  ])("%s is high/critical in screenshot analysis", async (url) => {
    const result = await analyzeScreenshotUrls(`Open ${url}`);
    expect(["critical", "high"]).toContain(result.maxUrlRisk);
  });

  it.each([
    "https://microsoft.com",
    "https://github.com",
    "https://openai.com",
    "https://vercel.com",
    "https://supabase.com",
  ])("%s stays safe/low", async (url) => {
    const result = await analyzeScreenshotUrls(`Docs: ${url}`);
    expect(["safe", "low"]).toContain(result.maxUrlRisk);
  });

  it("marks shorteners medium+", async () => {
    const result = await analyzeScreenshotUrls("https://bit.ly/abc123");
    expect(result.urlFindings[0]?.risk_level).not.toBe("safe");
    expect(result.riskFloor).toBeGreaterThanOrEqual(20);
  });
});

describe("AI risk floor", () => {
  it("prevents AI from marking phishing screenshot as safe", () => {
    const floored = applyUrlRiskFloor(55, 5, 90);
    expect(floored.risk_score).toBe(90);
    expect(floored.risk_level).toBe("critical");
  });
});

describe("Pipeline + screenshot merge", () => {
  it("detection pipeline on healed text yields critical URL finding", () => {
    const text = healOcrUrlText(
      "Verify account https://login.rnicrosoft.com/security/verify before access",
    );
    const { findings, riskScore } = runDetectionPipeline(text);
    const urls = findings.filter((f) => f.category === "url");
    expect(urls.length).toBeGreaterThan(0);
    expect(["critical", "high"]).toContain(urls[0]!.risk_level);
    expect(riskScore).toBeGreaterThanOrEqual(40);
  });

  it("merge prefers intelligence finding risk", () => {
    const weak: ImageFinding[] = [
      {
        id: "a",
        category: "url",
        label: "URL",
        value: "https://login.rnicrosoft.com/security/verify",
        risk_level: "medium",
        reason: "URL found",
        recommendation: "Review",
        confidence: 60,
      },
    ];
    const strong: ImageFinding[] = [
      {
        id: "b",
        category: "url",
        label: "Phishing URL · Microsoft",
        value: "https://login.rnicrosoft.com/security/verify",
        risk_level: "critical",
        reason: "rn replaces m",
        recommendation: "Use microsoft.com",
        confidence: 98,
      },
    ];
    const merged = mergeUrlFindings(weak, strong);
    expect(merged).toHaveLength(1);
    expect(merged[0]!.risk_level).toBe("critical");
    expect(merged[0]!.id).toBe("a");
  });
});
