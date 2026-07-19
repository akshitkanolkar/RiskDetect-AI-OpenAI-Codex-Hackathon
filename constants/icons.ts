/**
 * Icon system guidelines for SafeLens AI.
 * Use Lucide React exclusively. Prefer strokeWidth={1.75–2}.
 */

export const ICON_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
} as const;

export type IconSize = keyof typeof ICON_SIZES;

export const ICON_USAGE = {
  navigation: "md",
  button: "md",
  input: "sm",
  emptyState: "lg",
  hero: "xl",
} as const;
