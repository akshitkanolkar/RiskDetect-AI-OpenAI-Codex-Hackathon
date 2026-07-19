/**
 * RiskDetect AI Design Tokens — Radius, Elevation, Motion, Breakpoints, Z-Index
 */

export const radiusTokens = {
  none: "0",
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  "2xl": "1.25rem",
  "3xl": "1.5rem",
  full: "9999px",
} as const;

export const shadowTokens = {
  flat: "none",
  low: "var(--shadow-low)",
  medium: "var(--shadow-medium)",
  high: "var(--shadow-high)",
  floating: "var(--shadow-floating)",
  glass: "var(--shadow-glass)",
  hover: "var(--shadow-hover)",
  modal: "var(--shadow-modal)",
  dropdown: "var(--shadow-dropdown)",
  glow: "var(--shadow-glow)",
} as const;

export const animationTokens = {
  duration: {
    instant: "100ms",
    fast: "150ms",
    normal: "250ms",
    slow: "400ms",
    slower: "600ms",
  },
  easing: {
    default: "cubic-bezier(0.22, 1, 0.36, 1)",
    in: "cubic-bezier(0.4, 0, 1, 1)",
    out: "cubic-bezier(0, 0, 0.2, 1)",
    inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
} as const;

export const breakpointTokens = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
  "3xl": "1920px",
} as const;

export const zIndexTokens = {
  base: 0,
  dropdown: 50,
  sticky: 100,
  overlay: 200,
  modal: 300,
  popover: 400,
  toast: 500,
  command: 600,
  max: 9999,
} as const;

export const transitionTokens = {
  colors: "color, background-color, border-color, text-decoration-color, fill, stroke",
  transform: "transform",
  opacity: "opacity",
  shadow: "box-shadow",
  all: "all",
} as const;
