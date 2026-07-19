import { requireUser } from "@/lib/api/auth";
import { apiError, apiSuccess, logError } from "@/lib/api/response";
import { scanImage } from "@/services/image-scanner";

export const runtime = "nodejs";

const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/jpg"]);

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
    if (file.size > 8 * 1024 * 1024) {
      return apiError("File must be under 8MB", 400, "VALIDATION");
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
