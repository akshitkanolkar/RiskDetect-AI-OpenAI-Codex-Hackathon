/**
 * Compatibility shim — detection logic lives in `services/detection`.
 * Keep this path stable for any older imports.
 */
export {
  detectSensitivePatterns,
  scoreImageFindings,
  runDetectionPipeline,
} from "@/services/detection";
