import { createWorker } from "tesseract.js";
import jsQR from "jsqr";
import { aiService } from "@/services/ai";
import { createId, nowIso, saveImageScan, saveRiskHistory } from "@/lib/db/scans";
import { detectSensitivePatterns, scoreImageFindings } from "@/lib/secrets/patterns";
import type { ImageFinding, ImageScanRecord } from "@/types/scans";
import { scoreToRiskLevel } from "@/utils/risk";
import { logError } from "@/lib/api/response";

async function runOcr(buffer: Buffer): Promise<string> {
  try {
    const worker = await createWorker("eng");
    const result = await worker.recognize(buffer);
    await worker.terminate();
    return result.data.text?.trim() ?? "";
  } catch (error) {
    logError("ocr", "Tesseract failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return "";
  }
}

async function detectQrCodes(buffer: Buffer, mimeType: string): Promise<ImageFinding[]> {
  try {
    // Decode via createImageBitmap path is browser-only; on server use PNG/JPEG dimensions via sharp-less approach.
    // For MVP without sharp, skip pixel decode when canvas unavailable and rely on OCR "QR" hints.
    void buffer;
    void mimeType;
    return [];
  } catch {
    return [];
  }
}

function detectQrFromText(text: string): ImageFinding[] {
  const findings: ImageFinding[] = [];
  if (/qr\s*code|scan\s*to\s*pay|upi:\/\/|otpauth:\/\//i.test(text)) {
    findings.push({
      id: createId(),
      category: "qr",
      label: "QR / payment code reference",
      value: "QR-related content detected in OCR text",
      risk_level: "high",
      reason: "QR codes can redirect to phishing or payment fraud pages.",
      recommendation: "Do not scan unknown QR codes from shared screenshots.",
    });
  }
  const upiDeep = text.match(/upi:\/\/[^\s]+/gi) ?? [];
  for (const value of upiDeep) {
    findings.push({
      id: createId(),
      category: "qr",
      label: "UPI deep link",
      value,
      risk_level: "high",
      reason: "UPI payment deep links can trigger wallet prompts.",
      recommendation: "Verify payment requests inside your official banking app only.",
    });
  }
  // Keep jsQR imported for future canvas-based decoding in edge runtime upgrades
  void jsQR;
  return findings;
}

export async function scanImage(input: {
  userId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  buffer: Buffer;
}): Promise<ImageScanRecord> {
  const extractedText = await runOcr(input.buffer);
  const patternFindings = detectSensitivePatterns(extractedText);
  const qrFindings = [
    ...(await detectQrCodes(input.buffer, input.mimeType)),
    ...detectQrFromText(extractedText),
  ];
  const findings = [...patternFindings, ...qrFindings];

  const heuristicScore = scoreImageFindings(findings);
  const analysis = await aiService.analyzeImage({
    fileName: input.fileName,
    findings: findings.map((f) => ({
      category: f.category,
      label: f.label,
      value: f.value,
      risk_level: f.risk_level,
    })),
    extractedTextPreview: extractedText,
    heuristicScore,
  });

  const risk_score = analysis.risk_score;
  const risk_level = analysis.risk_level ?? scoreToRiskLevel(risk_score);

  const record: ImageScanRecord = {
    id: createId(),
    user_id: input.userId,
    file_name: input.fileName,
    mime_type: input.mimeType,
    file_size: input.fileSize,
    status: "completed",
    risk_level,
    risk_score,
    confidence: analysis.confidence,
    extracted_text: extractedText,
    findings,
    recommendations: analysis.recommendations,
    ai_explanation: analysis.ai_explanation,
    created_at: nowIso(),
    updated_at: nowIso(),
    deleted_at: null,
  };

  const saved = await saveImageScan(record);
  await saveRiskHistory({
    user_id: input.userId,
    scan_id: saved.id,
    scan_type: "image",
    risk_level: saved.risk_level,
    risk_score: saved.risk_score,
    recorded_at: nowIso(),
  });

  return saved;
}
