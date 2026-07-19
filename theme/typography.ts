/**
 * RiskDetect AI Design Tokens — Typography
 * Plus Jakarta Sans scale with responsive tracking and line-height.
 */

export const typographyTokens = {
  fontFamily: {
    sans: "var(--font-sans)",
    mono: "var(--font-mono)",
  },
  fontSize: {
    hero: [
      "clamp(2.5rem, 5vw, 4rem)",
      { lineHeight: "1.05", letterSpacing: "-0.04em", fontWeight: "700" },
    ],
    page: [
      "clamp(1.75rem, 3vw, 2.25rem)",
      { lineHeight: "1.15", letterSpacing: "-0.03em", fontWeight: "700" },
    ],
    section: ["1.5rem", { lineHeight: "1.25", letterSpacing: "-0.02em", fontWeight: "600" }],
    card: ["1.125rem", { lineHeight: "1.35", letterSpacing: "-0.01em", fontWeight: "600" }],
    subtitle: ["1.125rem", { lineHeight: "1.5", letterSpacing: "-0.01em", fontWeight: "500" }],
    body: ["0.9375rem", { lineHeight: "1.6", letterSpacing: "0", fontWeight: "400" }],
    caption: ["0.8125rem", { lineHeight: "1.45", letterSpacing: "0.01em", fontWeight: "400" }],
    label: ["0.8125rem", { lineHeight: "1.25", letterSpacing: "0.02em", fontWeight: "500" }],
    button: ["0.875rem", { lineHeight: "1", letterSpacing: "-0.01em", fontWeight: "550" }],
    small: ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.01em", fontWeight: "400" }],
    code: ["0.8125rem", { lineHeight: "1.6", letterSpacing: "0", fontWeight: "400" }],
  },
} as const;

export type TypographyToken = typeof typographyTokens;
