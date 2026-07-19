export { analyzeUrlIntelligence } from "./analyze";
export type { AnalyzeUrlOptions } from "./analyze";
export { parseUrl, normalizeUrl, parseHostnameParts, isIpHostname, isIpv4 } from "./parser";
export { normalizeDomain, estimateDomainAgeDays } from "./normalizer";
export { runHeuristicEngine } from "./heuristic-engine";
export { scoreRisk } from "./risk-scorer";
export { buildRecommendation } from "./recommendation-engine";
export { validateAndAnalyzeUrl } from "./shared-validator";
export {
  enrichOcrUrlFindings,
  analyzeOcrUrls,
  applyIntelligenceToFinding,
} from "./ocr-url-analyzer";
export {
  analyzeScreenshotUrls,
  mergeUrlFindings,
  applyUrlRiskFloor,
} from "./screenshot-url-analyzer";
export type { ScreenshotUrlAnalysis } from "./screenshot-url-analyzer";
export {
  healOcrUrlText,
  extractUrlsFromOcrText,
  prepareOcrTextForDetection,
} from "./url-extractor";
export type { ExtractedOcrUrl } from "./url-extractor";
export { UrlReputationService, urlReputationService } from "./reputation";
export type {
  ReputationProvider,
  ReputationProviderId,
  ReputationSignal,
  ReputationLookupResult,
} from "./reputation";
export { TRUSTED_BRANDS, SUSPICIOUS_TLDS, SHORTENER_DOMAINS, SUSPICIOUS_KEYWORDS } from "./brands";
export * from "./detectors";
export { levenshtein, levenshteinSimilarity } from "./utils/levenshtein";
export { damerauLevenshtein } from "./utils/damerau-levenshtein";
export { jaro, jaroWinkler } from "./utils/jaro-winkler";
export {
  foldVisualConfusables,
  generateSubstitutionVariants,
  describeSubstitutions,
} from "./utils/visual-similarity";
export type {
  UrlIntelligenceResult,
  UrlIntelligenceSignals,
  ParsedUrlParts,
  BrandEntry,
  BrandMatch,
  SignalContribution,
  UrlThreatCategory,
} from "./types";
