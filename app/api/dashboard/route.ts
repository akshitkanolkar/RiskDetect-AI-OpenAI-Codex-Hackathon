import { requireUser } from "@/lib/api/auth";
import { apiError, apiSuccess, logError } from "@/lib/api/response";
import { getDashboardData } from "@/services/dashboard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    if (!user) return apiError("Unauthorized", 401, "UNAUTHORIZED");
    const data = await getDashboardData(user.id);
    return apiSuccess(data);
  } catch (error) {
    logError("api/dashboard", "Failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return apiError("Failed to load dashboard", 500);
  }
}
