import { requireUser } from "@/lib/api/auth";
import { apiError, apiSuccess, logError } from "@/lib/api/response";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_UPLOAD_BYTES,
  MAX_IMAGE_UPLOAD_LABEL,
} from "@/constants";
import { scanImage } from "@/services/image-scanner";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const ALLOWED = new Set<string>(ALLOWED_IMAGE_MIME_TYPES);

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!user) return apiError("Unauthorized", 401, "UNAUTHORIZED");

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return apiError("Image file is required", 400, "VALIDATION");
    }
    if (!ALLOWED.has(file.type) && !file.name.match(/\.(png|jpe?g|webp)$/i)) {
      return apiError("Only PNG, JPEG, and WEBP are supported", 400, "VALIDATION");
    }
    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      return apiError(`File must be under ${MAX_IMAGE_UPLOAD_LABEL}`, 400, "VALIDATION");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await scanImage({
      userId: user.id,
      fileName: file.name,
      mimeType: file.type || "image/png",
      fileSize: file.size,
      buffer,
    });

    return apiSuccess(result, 201);
  } catch (error) {
    logError("api/scan/image", "Scan failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return apiError("Failed to scan image", 500, "SCAN_FAILED");
  }
}
