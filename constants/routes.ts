export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  SCANS: "/scans",
  SCAN_URL: "/scans/url",
  SCAN_IMAGE: "/scans/image",
  SCAN_DETAIL: (id: string) => `/scans/${id}` as const,
  SETTINGS: "/settings",
  PROFILE: "/profile",
  AUTH_CALLBACK: "/auth/callback",
  API: {
    AUTH: "/api/auth",
    HEALTH: "/api/health",
    SCAN_URL: "/api/scan/url",
    SCAN_IMAGE: "/api/scan/image",
    HISTORY: "/api/history",
    DASHBOARD: "/api/dashboard",
    CHAT: "/api/chat",
  },
} as const;

export const AUTH_ROUTES = [ROUTES.LOGIN, ROUTES.REGISTER] as const;

export const PROTECTED_ROUTES = [
  ROUTES.DASHBOARD,
  ROUTES.SCANS,
  ROUTES.SCAN_URL,
  ROUTES.SCAN_IMAGE,
  ROUTES.SETTINGS,
  ROUTES.PROFILE,
] as const;
