import { createWorker } from "tesseract.js";
import jsQR from "jsqr";
import { aiService } from "@/services/ai";
import { createId, nowIso, saveImageScan, saveRiskHistory } from "@/lib/db/scans";
import { runDetectionPipeline, scoreImageFindings } from "@/services/detection";
import { attachBoundingBoxes, type OcrWord } from "@/lib/viewer/map-ocr-boxes";
import { readImageDimensions } from "@/lib/viewer/image-dimensions";
import type { ImageFinding, ImageScanRecord } from "@/types/scans";
import { scoreToRiskLevel } from "@/utils/risk";
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
  const pipeline = runDetectionPipeline(ocr.text);
  const pixelQr = await detectQrCodes(input.buffer, input.mimeType);
  const findings = attachBoundingBoxes([...pipeline.findings, ...pixelQr], ocr.words);

  const heuristicScore = scoreImageFindings(findings);
  const analysis = await aiService.analyzeImage({
    fileName: input.fileName,
    findings: findings.map((f) => ({
      category: f.category,
      label: f.label,
      value: f.value,
      risk_level: f.risk_level,
    })),
    extractedTextPreview: ocr.text,
    heuristicScore,
  });

  const risk_score = analysis.risk_score;
  const risk_level = analysis.risk_level ?? scoreToRiskLevel(risk_score);

  // Always attach a data URL for the interactive viewer (kept in memory; may be omitted from remote DB).
  const image_data_url = bufferToDataUrl(input.buffer, input.mimeType);

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
    extracted_text: ocr.text,
    findings,
    recommendations: analysis.recommendations,
    ai_explanation: analysis.ai_explanation,
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
