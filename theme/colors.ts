/**
 * RiskDetect AI Design Tokens — Color
 * Dark-first cyan/slate identity: trust, security, intelligence.
 */

export const colorTokens = {
  brand: {
    DEFAULT: "hsl(var(--brand))",
    foreground: "hsl(var(--brand-foreground))",
    muted: "hsl(var(--brand-muted))",
    glow: "hsl(var(--brand-glow))",
  },
  surface: {
    DEFAULT: "hsl(var(--surface))",
    elevated: "hsl(var(--surface-elevated))",
    overlay: "hsl(var(--surface-overlay))",
  },
  info: {
    DEFAULT: "hsl(var(--info))",
    foreground: "hsl(var(--info-foreground))",
  },
  risk: {
    critical: "hsl(var(--risk-critical))",
    high: "hsl(var(--risk-high))",
    medium: "hsl(var(--risk-medium))",
    low: "hsl(var(--risk-low))",
    safe: "hsl(var(--risk-safe))",
  },
} as const;

export type ColorToken = typeof colorTokens;
