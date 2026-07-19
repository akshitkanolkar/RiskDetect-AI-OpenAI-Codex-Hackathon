import { isSupabaseConfigured } from "@/lib/env";
import { createServerClient } from "@/lib/supabase/server";
import { createId, memoryDb, nowIso } from "@/lib/db/memory";
import { listUserHistory } from "@/lib/db/scans";
import { aiService } from "@/services/ai";
import type { ChatMessageRecord } from "@/types/scans";

export async function getOrCreateChatSession(userId: string, sessionId?: string | null) {
  if (!isSupabaseConfigured()) {
    return memoryDb.getOrCreateSession(userId, sessionId);
  }

  const client = await createServerClient();
  if (sessionId) {
    const { data } = await client
      .from("chat_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .maybeSingle();
    if (data) return data;
  }

  const session = {
    id: createId(),
    user_id: userId,
    title: "Security Copilot",
    context_scan_ids: [] as string[],
    created_at: nowIso(),
    updated_at: nowIso(),
    deleted_at: null,
  };
  const { data, error } = await client.from("chat_sessions").insert(session).select().single();
  if (error || !data) return memoryDb.getOrCreateSession(userId, sessionId);
  return data;
}

export async function listChatMessages(sessionId: string, userId: string) {
  if (!isSupabaseConfigured()) {
    return memoryDb.listMessages(sessionId, userId);
  }
  const client = await createServerClient();
  const { data, error } = await client
    .from("chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  if (error || !data) return memoryDb.listMessages(sessionId, userId);
  return data as ChatMessageRecord[];
}

async function persistMessage(message: ChatMessageRecord) {
  if (!isSupabaseConfigured()) {
    return memoryDb.insertMessage(message);
  }
  const client = await createServerClient();
  const { data, error } = await client.from("chat_messages").insert(message).select().single();
  if (error || !data) return memoryDb.insertMessage(message);
  return data as ChatMessageRecord;
}

function buildScansContext(
  scans: Awaited<ReturnType<typeof listUserHistory>>,
): string {
  if (!scans.length) return "";
  return scans
    .slice(0, 5)
    .map((scan) => {
      if (scan.scan_type === "url") {
        return `- URL ${scan.normalized_url}: ${scan.risk_level} (${scan.risk_score}/100). ${scan.ai_explanation}`;
      }
      return `- Image ${scan.file_name}: ${scan.risk_level} (${scan.risk_score}/100), findings=${scan.findings.length}. ${scan.ai_explanation}`;
    })
    .join("\n");
}

export async function sendCopilotMessage(input: {
  userId: string;
  message: string;
  sessionId?: string | null;
  mode?: "simple" | "technical" | "checklist";
}) {
  const session = await getOrCreateChatSession(input.userId, input.sessionId);
  const history = await listChatMessages(session.id, input.userId);
  const scans = await listUserHistory(input.userId, "all", 8);
  const scansContext = buildScansContext(scans);

  const userMessage: ChatMessageRecord = {
    id: createId(),
    session_id: session.id,
    user_id: input.userId,
    role: "user",
    content: input.message,
    created_at: nowIso(),
    deleted_at: null,
  };
  await persistMessage(userMessage);

  const reply = await aiService.chat({
    mode: input.mode ?? "simple",
    message: input.message,
    history: [...history, userMessage].map((m) => ({
      role: m.role,
      content: m.content,
    })),
    scansContext,
  });

  const assistantMessage: ChatMessageRecord = {
    id: createId(),
    session_id: session.id,
    user_id: input.userId,
    role: "assistant",
    content: reply,
    created_at: nowIso(),
    deleted_at: null,
  };
  await persistMessage(assistantMessage);

  memoryDb.updateSessionContext(
    session.id,
    scans.slice(0, 5).map((s) => s.id),
  );

  return {
    sessionId: session.id,
    message: assistantMessage,
    messages: [...history, userMessage, assistantMessage],
  };
}
