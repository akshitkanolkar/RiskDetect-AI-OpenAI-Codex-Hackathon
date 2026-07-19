import type { FindingCategory, ImageFinding } from "@/types/scans";
import type { RiskLevel } from "@/types";

export type EntityType = FindingCategory;

export interface NormalizedOcr {
  /** Whitespace/Unicode-normalized text used for matching */
  text: string;
  /** Original OCR text (positions map into this when possible) */
  original: string;
  /** Unique tokens after duplicate removal (for secondary signals) */
  tokens: string[];
}

export interface RawCandidate {
  type: EntityType;
  value: string;
  start: number;
  end: number;
  matchedPattern: string;
}

export interface ValidationResult {
  valid: boolean;
  method: string;
  normalizedValue?: string;
  detail?: string;
}

export interface ContextSignal {
  label: string;
  score: number;
  keywords: string[];
}

export interface ScoredFinding {
  type: EntityType;
  value: string;
  start: number;
  end: number;
  confidence: number;
  severity: RiskLevel;
  reason: string;
  recommendation: string;
  validationMethod: string;
  matchedPattern: string;
  riskCategory: string;
  context: string;
  ocrSource: string;
}

export type DetectionFinding = ImageFinding;

export interface DetectionPipelineResult {
  findings: DetectionFinding[];
  riskScore: number;
  normalizedText: string;
}
