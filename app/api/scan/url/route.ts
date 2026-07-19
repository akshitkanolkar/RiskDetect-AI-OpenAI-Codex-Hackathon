import { requireUser } from "@/lib/api/auth";
import { apiError, apiSuccess, logError } from "@/lib/api/response";
import { urlScanSchema } from "@/lib/validations/scan";
import { scanUrl } from "@/services/url-scanner";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!user) return apiError("Unauthorized", 401, "UNAUTHORIZED");

    const body = await request.json();
    const parsed = urlScanSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0]?.message ?? "Invalid URL", 400, "VALIDATION");
    }

    const result = await scanUrl(user.id, parsed.data.url);
    return apiSuccess(result, 201);
  } catch (error) {
    logError("api/scan/url", "Scan failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return apiError("Failed to scan URL", 500, "SCAN_FAILED");
  }
}
