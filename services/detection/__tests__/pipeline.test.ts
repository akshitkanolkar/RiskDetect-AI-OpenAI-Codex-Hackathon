import { describe, expect, it } from "vitest";
import {
  validateEmail,
  validateUpi,
  validatePhone,
  validateAadhaar,
  validatePan,
  validateCard,
  validateIfsc,
  luhnCheck,
  verhoeffCheck,
} from "@/services/detection/validators";
import { runDetectionPipeline } from "@/services/detection";

describe("email validator", () => {
  it("accepts RFC-shaped emails", () => {
    expect(validateEmail("support@razorpay.com").valid).toBe(true);
    expect(validateEmail("no-reply@razorpay.com").valid).toBe(true);
  });

  it("rejects malformed emails", () => {
    expect(validateEmail("not-an-email").valid).toBe(false);
    expect(validateEmail("user@").valid).toBe(false);
    expect(validateEmail("@domain.com").valid).toBe(false);
    expect(validateEmail("aarav@oksbi").valid).toBe(false);
  });
});

describe("UPI validator", () => {
  it("accepts known PSP handles", () => {
    expect(validateUpi("aarav@oksbi").valid).toBe(true);
    expect(validateUpi("shop@ybl").valid).toBe(true);
    expect(validateUpi("user@paytm").valid).toBe(true);
  });

  it("never accepts emails as UPI", () => {
    expect(validateUpi("support@razorpay.com").valid).toBe(false);
    expect(validateUpi("no-reply@razorpay.com").valid).toBe(false);
    expect(validateUpi("a@b.org").valid).toBe(false);
    expect(validateUpi("x@y.net").valid).toBe(false);
    expect(validateUpi("x@y.co").valid).toBe(false);
  });

  it("rejects malformed UPI", () => {
    expect(validateUpi("@@@").valid).toBe(false);
    expect(validateUpi("onlylocal").valid).toBe(false);
  });
});

describe("phone validator", () => {
  it("accepts Indian mobiles with country code", () => {
    const r = validatePhone("918067464242");
    expect(r.valid).toBe(true);
    expect(r.detail).toContain("IN");
  });

  it("accepts +91 formatted numbers", () => {
    expect(validatePhone("+91 80674 64242").valid).toBe(true);
  });

  it("rejects short / trivial numbers", () => {
    expect(validatePhone("12345").valid).toBe(false);
    expect(validatePhone("0000000000").valid).toBe(false);
  });
});

describe("Aadhaar validator", () => {
  it("requires Verhoeff checksum", () => {
    expect(validateAadhaar("234567890008").valid).toBe(true);
    expect(verhoeffCheck("234567890008")).toBe(true);
  });

  it("rejects checksum failures", () => {
    expect(validateAadhaar("234567890001").valid).toBe(false);
    expect(validateAadhaar("123456789012").valid).toBe(false);
  });

  it("rejects phone-shaped 12-digit numbers", () => {
    expect(validateAadhaar("918067464242").valid).toBe(false);
  });

  it("rejects wrong length", () => {
    expect(validateAadhaar("1234 5678 901").valid).toBe(false);
  });
});

describe("PAN validator", () => {
  it("accepts valid PAN", () => {
    expect(validatePan("ABCPE1234F").valid).toBe(true);
    expect(validatePan("AAAPA1234A").valid).toBe(true);
  });

  it("rejects malformed PAN", () => {
    expect(validatePan("ABCDE12345").valid).toBe(false);
    expect(validatePan("ABCD1234F").valid).toBe(false);
    expect(validatePan("ABCXE1234F").valid).toBe(false); // invalid 4th char
    expect(validatePan("ABCDE1234F").valid).toBe(false); // D is not a valid entity code
  });
});

describe("card / Luhn validator", () => {
  it("accepts Luhn-valid Visa test card", () => {
    const r = validateCard("4111 1111 1111 1111");
    expect(r.valid).toBe(true);
    expect(luhnCheck("4111111111111111")).toBe(true);
  });

  it("rejects random numbers that fail Luhn", () => {
    expect(validateCard("1234567890123456").valid).toBe(false);
    expect(validateCard("9999999999999999").valid).toBe(false);
    expect(validateCard("4242424242424241").valid).toBe(false);
  });
});

describe("IFSC validator", () => {
  it("accepts valid IFSC", () => {
    expect(validateIfsc("SBIN0001234").valid).toBe(true);
  });

  it("rejects malformed IFSC", () => {
    expect(validateIfsc("SBIN1234567").valid).toBe(false);
    expect(validateIfsc("SB00001234").valid).toBe(false);
  });
});

describe("detection pipeline — false positive fixes", () => {
  it("classifies support@razorpay.com as email, not UPI", () => {
    const { findings } = runDetectionPipeline(
      "Support Section\nContact support@razorpay.com for help",
    );
    const emails = findings.filter((f) => f.category === "email");
    const upis = findings.filter((f) => f.category === "upi");
    expect(emails.some((f) => f.value.includes("support@razorpay.com"))).toBe(true);
    expect(upis.some((f) => f.value.includes("support@razorpay.com"))).toBe(false);
  });

  it("classifies no-reply@razorpay.com as email, not UPI", () => {
    const { findings } = runDetectionPipeline("From: no-reply@razorpay.com");
    expect(findings.some((f) => f.category === "email" && f.value.includes("no-reply"))).toBe(true);
    expect(findings.some((f) => f.category === "upi" && f.value.includes("no-reply"))).toBe(false);
  });

  it("classifies 918067464242 as phone, not Aadhaar", () => {
    const { findings } = runDetectionPipeline("Call us at 918067464242");
    expect(findings.some((f) => f.category === "phone")).toBe(true);
    expect(findings.some((f) => f.category === "aadhaar")).toBe(false);
  });

  it("does not flag random numbers as credit cards", () => {
    const { findings } = runDetectionPipeline("Reference 1234567890123456 invoice total");
    expect(findings.some((f) => f.category === "credit_card" || f.category === "debit_card")).toBe(
      false,
    );
  });

  it("detects valid UPI and valid card with confidence metadata", () => {
    const { findings } = runDetectionPipeline(
      "Pay aarav@oksbi\nCard 4111111111111111\nAadhaar 2345 6789 0008",
    );
    const upi = findings.find((f) => f.category === "upi");
    const card = findings.find((f) => f.category === "credit_card");
    const aadhaar = findings.find((f) => f.category === "aadhaar");

    expect(upi?.value).toContain("aarav@oksbi");
    expect(card?.validation_method).toMatch(/Luhn/i);
    expect(aadhaar?.validation_method).toMatch(/Verhoeff/i);
    expect(typeof upi?.confidence).toBe("number");
    expect((upi?.confidence ?? 0) > 50).toBe(true);
  });

  it("deduplicates repeated entities", () => {
    const { findings } = runDetectionPipeline(
      "support@razorpay.com support@razorpay.com support@razorpay.com",
    );
    const emails = findings.filter(
      (f) => f.category === "email" && f.value.includes("support@razorpay.com"),
    );
    expect(emails).toHaveLength(1);
  });

  it("includes reason, recommendation, and risk category", () => {
    const { findings } = runDetectionPipeline("Email support@example.com");
    const email = findings.find((f) => f.category === "email");
    expect(email?.reason.length).toBeGreaterThan(20);
    expect(email?.recommendation.length).toBeGreaterThan(10);
    expect(email?.risk_category).toBe("PII");
  });
});
