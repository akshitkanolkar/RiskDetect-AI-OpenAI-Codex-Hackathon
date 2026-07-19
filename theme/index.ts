export { colorTokens } from "./colors";
export { typographyTokens } from "./typography";
export { spacingTokens, layoutTokens } from "./spacing";
export {
  radiusTokens,
  shadowTokens,
  animationTokens,
  breakpointTokens,
  zIndexTokens,
  transitionTokens,
} from "./tokens";

export const theme = {
  name: "SafeLens AI",
  defaultMode: "dark" as const,
  identity: {
    tagline: "See digital risks before they become disasters.",
    accent: "cyan-lens",
    surfaces: "glass-depth",
  },
} as const;
