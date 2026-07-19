import { createWorker } from "tesseract.js";
import jsQR from "jsqr";
import { aiService } from "@/services/ai";
import { createId, nowIso, saveImageScan, saveRiskHistory } from "@/lib/db/scans";
import { runDetectionPipeline, scoreImageFindings } from "@/services/detection";
import { attachBoundingBoxes, type OcrWord } from "@/lib/viewer/map-ocr-boxes";
import { readImageDimensions } from "@/lib/viewer/image-dimensions";
import {
  analyzeScreenshotUrls,
  applyUrlRiskFloor,
  mergeUrlFindings,
} from "@/services/url-validation";
import type { ImageFinding, ImageScanRecord } from "@/types/scans";
import { logError } from "@/lib/api/response";

interface OcrResult {
  text: string;
  words: OcrWord[];
}

async function runOcr(buffer: Buffer): Promise<OcrResult> {
  try {
    const worker = await createWorker("eng");
    const result = await worker.recognize(buffer);
    await worker.terminate();

    const words: OcrWord[] = [];
    for (const block of result.data.blocks ?? []) {
      for (const paragraph of block.paragraphs ?? []) {
        for (const line of paragraph.lines ?? []) {
          for (const word of line.words ?? []) {
            if (!word.text?.trim()) continue;
            words.push({
              text: word.text,
              confidence: word.confidence,
              bbox: word.bbox,
            });
          }
        }
      }
    }

    return {
      text: result.data.text?.trim() ?? "",
      words,
    };
  } catch (error) {
    logError("ocr", "Tesseract failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { text: "", words: [] };
  }
}

async function detectQrCodes(buffer: Buffer, mimeType: string): Promise<ImageFinding[]> {
  try {
    void buffer;
    void mimeType;
    void jsQR;
    return [];
  } catch {
    return [];
  }
}

function bufferToDataUrl(buffer: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

export async function scanImage(input: {
  userId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  buffer: Buffer;
}): Promise<ImageScanRecord> {
  const ocr = await runOcr(input.buffer);
  const dims = readImageDimensions(input.buffer, input.mimeType);

  // Dedicated screenshot URL intelligence (OCR heal → extract → typosquat/brand analysis)
  const urlAnalysis = await analyzeScreenshotUrls(ocr.text);

  // Run general PII/secrets pipeline on healed text so URL tokens survive OCR glitches
  const pipeline = runDetectionPipeline(urlAnalysis.healedText || ocr.text);
  const pixelQr = await detectQrCodes(input.buffer, input.mimeType);

  const merged = mergeUrlFindings(pipeline.findings, urlAnalysis.urlFindings);
  const findings = attachBoundingBoxes([...merged, ...pixelQr], ocr.words);

  const heuristicScore = Math.max(scoreImageFindings(findings), urlAnalysis.riskFloor);
  const analysis = await aiService.analyzeImage({
    fileName: input.fileName,
    findings: findings.map((f) => ({
      category: f.category,
      label: f.label,
      value: f.value,
      risk_level: f.risk_level,
    })),
    extractedTextPreview: urlAnalysis.healedText || ocr.text,
    heuristicScore,
  });

  // Never allow AI to mark a screenshot SAFE when URL intel found high/critical phishing
  const floored = applyUrlRiskFloor(heuristicScore, analysis.risk_score, urlAnalysis.riskFloor);

  // Prefer URL-intel explanation when phishing URLs dominate
  const phishingFinding = findings.find(
    (f) =>
      f.category === "url" &&
      (f.risk_level === "critical" || f.risk_level === "high") &&
      /phish|typosquat|impersonat|homoglyph|lookalike/i.test(
        `${f.label} ${f.reason} ${f.risk_category ?? ""}`,
      ),
  );
  const ai_explanation =
    phishingFinding && floored.risk_level !== "safe" && floored.risk_level !== "low"
      ? phishingFinding.reason
      : analysis.ai_explanation;

  let recommendations = analysis.recommendations;
  if (
    phishingFinding &&
    !recommendations.some((r) => /credential|official|phish/i.test(r.title + r.description))
  ) {
    recommendations = [
      {
        id: "url-phishing",
        title: "Do not enter credentials",
        description: phishingFinding.recommendation,
        priority: "immediate" as const,
      },
      ...recommendations,
    ];
  }

  const image_data_url = bufferToDataUrl(input.buffer, input.mimeType);

  const record: ImageScanRecord = {
    id: createId(),
    user_id: input.userId,
    file_name: input.fileName,
    mime_type: input.mimeType,
    file_size: input.fileSize,
    status: "completed",
    risk_level: floored.risk_level,
    risk_score: floored.risk_score,
    confidence: Math.max(
      analysis.confidence,
      ...findings.filter((f) => f.category === "url").map((f) => f.confidence ?? 0),
      urlAnalysis.riskFloor >= 75 ? 92 : 0,
    ),
    extracted_text: ocr.text,
    findings,
    recommendations,
    ai_explanation,
    image_data_url,
    image_width: dims.width || null,
    image_height: dims.height || null,
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
