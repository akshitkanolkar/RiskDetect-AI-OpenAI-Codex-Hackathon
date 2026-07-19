import { describe, expect, it } from "vitest";
import {
  analyzeUrlIntelligence,
  damerauLevenshtein,
  jaroWinkler,
  levenshtein,
  enrichOcrUrlFindings,
} from "@/services/url-validation";
import type { ImageFinding } from "@/types/scans";

describe("distance utilities", () => {
  it("computes Levenshtein distance", () => {
    expect(levenshtein("microsoft", "rnicrosoft")).toBe(2);
    expect(levenshtein("github", "githhub")).toBe(1);
    expect(levenshtein("google", "goog1e")).toBe(1);
  });

  it("computes Damerau–Levenshtein with transposition", () => {
    expect(damerauLevenshtein("ab", "ba")).toBe(1);
  });

  it("computes high Jaro–Winkler for near matches", () => {
    expect(jaroWinkler("paypal", "paypai")).toBeGreaterThan(0.9);
    expect(jaroWinkler("microsoft", "microsoft")).toBe(1);
  });
});

describe("URL intelligence — safe official domains", () => {
  it.each(["microsoft.com", "github.com", "google.com", "paypal.com", "apple.com"])(
    "%s is safe / low risk",
    (domain) => {
      const result = analyzeUrlIntelligence(`https://${domain}`);
      expect(result.riskLevel === "safe" || result.riskLevel === "low").toBe(true);
      expect(result.riskScore).toBeLessThan(40);
      expect(result.signals.isTyposquat).toBe(false);
      expect(result.signals.isBrandImpersonation).toBe(false);
    },
  );
});

describe("URL intelligence — typosquatting / critical lookalikes", () => {
  it("flags rnicrosoft.com as critical brand impersonation", () => {
    const result = analyzeUrlIntelligence("https://rnicrosoft.com/security");
    expect(result.signals.isTyposquat || result.signals.isBrandImpersonation).toBe(true);
    expect(result.riskLevel === "critical" || result.riskLevel === "high").toBe(true);
    expect(result.riskScore).toBeGreaterThanOrEqual(70);
    expect(result.brandName).toBe("Microsoft");
    expect(result.officialDomain).toContain("microsoft.com");
    expect(result.reasons.some((r) => /rn|lookalike|imitate|Microsoft/i.test(r))).toBe(true);
  });

  it("flags githhub.com as high/critical", () => {
    const result = analyzeUrlIntelligence("https://githhub.com");
    expect(result.signals.isTyposquat).toBe(true);
    expect(result.riskLevel === "critical" || result.riskLevel === "high").toBe(true);
    expect(result.brandName).toBe("GitHub");
  });

  it("flags goog1e.com as critical", () => {
    const result = analyzeUrlIntelligence("https://goog1e.com");
    expect(result.signals.isTyposquat || result.signals.hasHomoglyph).toBe(true);
    expect(result.riskLevel === "critical" || result.riskLevel === "high").toBe(true);
    expect(result.brandName).toBe("Google");
  });

  it("flags paypaI.com (I/l confusion) as critical", () => {
    const result = analyzeUrlIntelligence("https://paypaI.com");
    expect(result.signals.isTyposquat || result.signals.isBrandImpersonation).toBe(true);
    expect(result.riskLevel === "critical" || result.riskLevel === "high").toBe(true);
    expect(result.brandName).toBe("PayPal");
  });

  it("flags amaz0n.com and faceb00k.com", () => {
    const amazon = analyzeUrlIntelligence("https://amaz0n.com");
    const fb = analyzeUrlIntelligence("https://faceb00k.com");
    expect(amazon.signals.isTyposquat).toBe(true);
    expect(fb.signals.isTyposquat).toBe(true);
    expect(amazon.riskScore).toBeGreaterThanOrEqual(70);
    expect(fb.riskScore).toBeGreaterThanOrEqual(70);
  });

  it("flags instagrarn.com", () => {
    const result = analyzeUrlIntelligence("https://instagrarn.com");
    expect(result.signals.isTyposquat || result.signals.isBrandImpersonation).toBe(true);
    expect(result.brandName).toMatch(/Instagram|Facebook/);
  });
});

describe("URL intelligence — other heuristics", () => {
  it("flags IP address URLs as high", () => {
    const result = analyzeUrlIntelligence("http://192.168.1.1/login");
    expect(result.signals.hasIpHost).toBe(true);
    expect(result.riskLevel === "high" || result.riskLevel === "critical").toBe(true);
    expect(result.riskScore).toBeGreaterThanOrEqual(40);
  });

  it("flags shortened URLs as medium+", () => {
    const result = analyzeUrlIntelligence("https://bit.ly/xxxx");
    expect(result.signals.isShortened).toBe(true);
    expect(result.riskScore).toBeGreaterThanOrEqual(15);
    expect(["medium", "high", "critical", "low"]).toContain(result.riskLevel);
    expect(result.reasons.some((r) => /shortener|expand/i.test(r))).toBe(true);
  });

  it("flags deep subdomain + brand bait", () => {
    const result = analyzeUrlIntelligence("https://login.microsoft.secure.randomdomain.xyz/auth");
    expect(result.signals.hasDeepSubdomains || result.signals.isBrandImpersonation).toBe(true);
    expect(result.riskScore).toBeGreaterThanOrEqual(30);
  });

  it("detects suspicious keywords with impersonation", () => {
    const result = analyzeUrlIntelligence("https://rnicrosoft.com/login/verify");
    expect(result.signals.suspiciousKeywords.length).toBeGreaterThan(0);
    expect(result.reasons.some((r) => /keyword|login|verify/i.test(r))).toBe(true);
  });

  it("produces confidence and recommended action", () => {
    const result = analyzeUrlIntelligence("https://rnicrosoft.com");
    expect(result.confidence).toBeGreaterThanOrEqual(50);
    expect(result.recommendedAction.toLowerCase()).toMatch(/official|avoid|credential/);
  });
});

describe("OCR URL enrichment", () => {
  it("upgrades screenshot URL findings with intelligence", () => {
    const findings: ImageFinding[] = [
      {
        id: "1",
        category: "url",
        label: "URL",
        value: "https://githhub.com/login",
        risk_level: "medium",
        reason: "URL found",
        recommendation: "Review",
        confidence: 70,
      },
    ];
    const enriched = enrichOcrUrlFindings(findings);
    expect(enriched[0]!.risk_level === "high" || enriched[0]!.risk_level === "critical").toBe(true);
    expect(enriched[0]!.validation_method).toBe("URL Intelligence");
    expect(enriched[0]!.reason.length).toBeGreaterThan(findings[0]!.reason.length);
  });

  it("leaves non-URL findings untouched", () => {
    const findings: ImageFinding[] = [
      {
        id: "2",
        category: "email",
        label: "Email",
        value: "a@b.com",
        risk_level: "medium",
        reason: "email",
        recommendation: "mask",
      },
    ];
    expect(enrichOcrUrlFindings(findings)[0]).toEqual(findings[0]);
  });
});
