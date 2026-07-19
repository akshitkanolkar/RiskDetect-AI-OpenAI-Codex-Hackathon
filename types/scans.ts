import type { RiskLevel, ScanStatus } from "@/types";

export interface TimelineEvent {
  id: string;
  label: string;
  detail: string;
  status: "success" | "warning" | "danger" | "info" | "default";
  at: string;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: "immediate" | "soon" | "optional";
}

export interface UrlScanSignals {
  suspiciousKeywords: string[];
  protocol: string;
  domain: string;
  hasIpHost: boolean;
  hasHomoglyph: boolean;
  listedInUrlhaus: boolean;
  listedInOpenPhish: boolean;
  domainAgeDays: number | null;
  heuristicScore: number;
}

export interface UrlScanRecord {
  id: string;
  user_id: string;
  url: string;
  normalized_url: string;
  domain: string;
  protocol: string;
  status: ScanStatus;
  risk_level: RiskLevel;
  risk_score: number;
  confidence: number;
  threat_category: string;
  reasons: string[];
  recommendations: Recommendation[];
  ai_explanation: string;
  timeline: TimelineEvent[];
  signals: UrlScanSignals;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type FindingCategory =
  | "email"
  | "phone"
  | "upi"
  | "qr"
  | "credit_card"
  | "debit_card"
  | "cvv"
  | "card_expiry"
  | "bank_account"
  | "ifsc"
  | "pan"
  | "aadhaar"
  | "passport"
  | "password"
  | "api_key"
  | "jwt"
  | "aws_key"
  | "github_token"
  | "private_key"
  | "secret"
  | "url"
  | "ip_address"
  | "mac_address"
  | "transaction_id"
  | "order_id"
  | "invoice_id"
  | "sensitive";

/** Pixel bounding box in original image coordinates (Tesseract space). */
export interface FindingBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageFinding {
  id: string;
  category: FindingCategory;
  label: string;
  value: string;
  risk_level: RiskLevel;
  reason: string;
  recommendation: string;
  start?: number;
  end?: number;
  confidence?: number;
  validation_method?: string;
  risk_category?: string;
  ocr_source?: string;
  context?: string;
  /** Absolute pixel box on the source image, when OCR layout was available. */
  bbox?: FindingBoundingBox;
}

export interface ImageScanRecord {
  id: string;
  user_id: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  status: ScanStatus;
  risk_level: RiskLevel;
  risk_score: number;
  confidence: number;
  extracted_text: string;
  findings: ImageFinding[];
  recommendations: Recommendation[];
  ai_explanation: string;
  /** Data URL of the uploaded screenshot (demo / preview persistence). */
  image_data_url?: string | null;
  image_width?: number | null;
  image_height?: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type UnifiedScan =
  (UrlScanRecord & { scan_type: "url" }) | (ImageScanRecord & { scan_type: "image" });

export interface ChatSessionRecord {
  id: string;
  user_id: string;
  title: string;
  context_scan_ids: string[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ChatMessageRecord {
  id: string;
  session_id: string;
  user_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  deleted_at: string | null;
}

export interface RiskHistoryRecord {
  id: string;
  user_id: string;
  scan_id: string | null;
  scan_type: "url" | "image";
  risk_level: RiskLevel;
  risk_score: number;
  recorded_at: string;
  deleted_at: string | null;
}

export interface DashboardData {
  riskScore: number;
  riskLevel: RiskLevel;
  todayScans: number;
  totalScans: number;
  recentThreats: number;
  riskTrend: Array<{ date: string; score: number }>;
  riskDistribution: Array<{ name: string; value: number; level: RiskLevel }>;
  recentScans: UnifiedScan[];
  activity: Array<{
    id: string;
    title: string;
    description: string;
    timestamp: string;
    risk_level: RiskLevel;
    scan_type: "url" | "image";
  }>;
}
