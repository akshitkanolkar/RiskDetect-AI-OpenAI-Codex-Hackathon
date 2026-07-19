export { normalizeOcrText, contextWindow } from "./ocr-normalize";
export { extractCandidates } from "./extractors";
export { analyzeContext } from "./context";
export { computeConfidence } from "./confidence";
export { classifySeverity, riskCategoryFor } from "./severity";
export { explainFinding, labelFor } from "./explanations";
export { recommendFor } from "./recommendations";
export { dedupeFindings } from "./dedupe";
export { runDetectionPipeline, detectSensitivePatterns, scoreImageFindings } from "./pipeline";
export type {
  DetectionFinding,
  DetectionPipelineResult,
  NormalizedOcr,
  RawCandidate,
  ScoredFinding,
} from "./types";
export * from "./validators";
