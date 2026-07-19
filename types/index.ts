import type { RISK_LEVELS, SCAN_TYPES } from "@/constants";

export type RiskLevel = (typeof RISK_LEVELS)[keyof typeof RISK_LEVELS];
export type ScanType = (typeof SCAN_TYPES)[keyof typeof SCAN_TYPES];

export type ScanStatus = "pending" | "running" | "completed" | "failed";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Scan {
  id: string;
  user_id: string;
  type: ScanType;
  target: string;
  status: ScanStatus;
  risk_level: RiskLevel | null;
  score: number | null;
  findings: ScanFinding[];
  metadata: Record<string, unknown>;
  created_at: string;
  completed_at: string | null;
}

export interface ScanFinding {
  id: string;
  title: string;
  description: string;
  risk_level: RiskLevel;
  category: string;
  evidence?: string;
  remediation?: string;
}

export interface ThreatIntel {
  id: string;
  source: string;
  indicator: string;
  indicator_type: "url" | "domain" | "ip" | "email" | "hash";
  risk_level: RiskLevel;
  description: string;
  first_seen: string;
  last_seen: string;
}

export interface ApiResponse<T> {
  data: T;
  error: null;
}

export interface ApiError {
  data: null;
  error: {
    message: string;
    code?: string;
    status?: number;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
