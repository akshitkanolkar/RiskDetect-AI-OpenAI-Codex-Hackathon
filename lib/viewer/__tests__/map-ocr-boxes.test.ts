import { describe, expect, it } from "vitest";
import { attachBoundingBoxes } from "@/lib/viewer/map-ocr-boxes";
import type { ImageFinding } from "@/types/scans";

describe("attachBoundingBoxes", () => {
  it("unions consecutive OCR words for a multi-token value", () => {
    const findings: ImageFinding[] = [
      {
        id: "1",
        category: "email",
        label: "Email",
        value: "support@razorpay.com",
        risk_level: "medium",
        reason: "test",
        recommendation: "blur",
      },
    ];
    const words = [
      { text: "Hello", confidence: 90, bbox: { x0: 0, y0: 0, x1: 40, y1: 20 } },
      {
        text: "support@razorpay.com",
        confidence: 95,
        bbox: { x0: 50, y0: 10, x1: 220, y1: 28 },
      },
    ];
    const mapped = attachBoundingBoxes(findings, words);
    expect(mapped[0].bbox).toBeDefined();
    expect(mapped[0].bbox!.x).toBeLessThanOrEqual(50);
    expect(mapped[0].bbox!.width).toBeGreaterThan(100);
  });
});
