export const APP_NAME = "SafeLens AI";
export const APP_TAGLINE = "See digital risks before they become disasters.";
export const APP_DESCRIPTION =
  "SafeLens AI helps you identify privacy leaks, phishing attempts, scams, exposed credentials, malicious URLs, unsafe screenshots, and digital footprint risks using AI and public threat intelligence.";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const QUERY_KEYS = {
  USER: ["user"] as const,
  PROFILE: ["profile"] as const,
  SCANS: ["scans"] as const,
  SCAN: (id: string) => ["scans", id] as const,
  HISTORY: ["history"] as const,
  DASHBOARD: ["dashboard"] as const,
  CHAT: ["chat"] as const,
  HEALTH: ["health"] as const,
} as const;

export const RISK_LEVELS = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
  SAFE: "safe",
} as const;

export const SCAN_TYPES = {
  URL: "url",
  EMAIL: "email",
  CREDENTIAL: "credential",
  SCREENSHOT: "screenshot",
  FOOTPRINT: "footprint",
} as const;

export {
  ROUTES,
  AUTH_ROUTES,
  PROTECTED_ROUTES,
} from "./routes";
