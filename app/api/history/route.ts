import { requireUser } from "@/lib/api/auth";
import { apiError, apiSuccess, logError } from "@/lib/api/response";
import { historyQuerySchema } from "@/lib/validations/scan";
import { getImageScanById, getUrlScanById, listUserHistory } from "@/lib/db/scans";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    if (!user) return apiError("Unauthorized", 401, "UNAUTHORIZED");

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const type = searchParams.get("scanType");

    if (id) {
      if (type === "image") {
        const scan = await getImageScanById(id, user.id);
        if (!scan) return apiError("Scan not found", 404, "NOT_FOUND");
        return apiSuccess({ ...scan, scan_type: "image" });
      }
      const scan = await getUrlScanById(id, user.id);
      if (!scan) {
        const image = await getImageScanById(id, user.id);
        if (!image) return apiError("Scan not found", 404, "NOT_FOUND");
        return apiSuccess({ ...image, scan_type: "image" });
      }
      return apiSuccess({ ...scan, scan_type: "url" });
    }

    const parsed = historyQuerySchema.safeParse({
      type: searchParams.get("type") ?? "all",
      limit: searchParams.get("limit") ?? "25",
    });
    if (!parsed.success) {
      return apiError("Invalid query", 400, "VALIDATION");
    }

    const history = await listUserHistory(user.id, parsed.data.type, parsed.data.limit);
    return apiSuccess(history);
  } catch (error) {
    logError("api/history", "Failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return apiError("Failed to load history", 500);
  }
}
