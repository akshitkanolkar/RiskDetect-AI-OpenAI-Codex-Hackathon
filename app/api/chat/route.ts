import { requireUser } from "@/lib/api/auth";
import { apiError, apiSuccess, logError } from "@/lib/api/response";
import { chatMessageSchema } from "@/lib/validations/scan";
import { listChatMessages, sendCopilotMessage, getOrCreateChatSession } from "@/services/chat";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    if (!user) return apiError("Unauthorized", 401, "UNAUTHORIZED");
    const sessionId = new URL(request.url).searchParams.get("sessionId");
    const session = await getOrCreateChatSession(user.id, sessionId);
    const messages = await listChatMessages(session.id, user.id);
    return apiSuccess({ sessionId: session.id, messages });
  } catch (error) {
    logError("api/chat", "GET failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return apiError("Failed to load chat", 500);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!user) return apiError("Unauthorized", 401, "UNAUTHORIZED");

    const body = await request.json();
    const parsed = chatMessageSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0]?.message ?? "Invalid message", 400, "VALIDATION");
    }

    const result = await sendCopilotMessage({
      userId: user.id,
      message: parsed.data.message,
      sessionId: parsed.data.sessionId,
      mode: parsed.data.mode,
    });

    return apiSuccess(result);
  } catch (error) {
    logError("api/chat", "POST failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return apiError("Failed to send message", 500);
  }
}
