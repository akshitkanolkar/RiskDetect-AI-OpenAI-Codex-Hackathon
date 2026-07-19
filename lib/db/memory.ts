import { randomUUID } from "crypto";
import type {
  ChatMessageRecord,
  ChatSessionRecord,
  ImageScanRecord,
  RiskHistoryRecord,
  UrlScanRecord,
} from "@/types/scans";

type StoreShape = {
  urlScans: UrlScanRecord[];
  imageScans: ImageScanRecord[];
  chatSessions: ChatSessionRecord[];
  chatMessages: ChatMessageRecord[];
  riskHistory: RiskHistoryRecord[];
};

const globalStore = globalThis as unknown as { __riskdetectStore?: StoreShape };

function store(): StoreShape {
  if (!globalStore.__riskdetectStore) {
    globalStore.__riskdetectStore = {
      urlScans: [],
      imageScans: [],
      chatSessions: [],
      chatMessages: [],
      riskHistory: [],
    };
  }
  return globalStore.__riskdetectStore;
}

export function createId() {
  return randomUUID();
}

export function nowIso() {
  return new Date().toISOString();
}

export const memoryDb = {
  insertUrlScan(record: UrlScanRecord) {
    store().urlScans.unshift(record);
    return record;
  },
  insertImageScan(record: ImageScanRecord) {
    const list = store().imageScans;
    const idx = list.findIndex((s) => s.id === record.id);
    if (idx >= 0) list[idx] = record;
    else list.unshift(record);
    return record;
  },
  insertRiskHistory(record: RiskHistoryRecord) {
    store().riskHistory.unshift(record);
    return record;
  },
  listUrlScans(userId: string) {
    return store().urlScans.filter((s) => s.user_id === userId && !s.deleted_at);
  },
  listImageScans(userId: string) {
    return store().imageScans.filter((s) => s.user_id === userId && !s.deleted_at);
  },
  getUrlScan(id: string, userId: string) {
    return (
      store().urlScans.find((s) => s.id === id && s.user_id === userId && !s.deleted_at) ?? null
    );
  },
  getImageScan(id: string, userId: string) {
    return (
      store().imageScans.find((s) => s.id === id && s.user_id === userId && !s.deleted_at) ?? null
    );
  },
  listRiskHistory(userId: string) {
    return store().riskHistory.filter((r) => r.user_id === userId && !r.deleted_at);
  },
  getOrCreateSession(userId: string, sessionId?: string | null) {
    if (sessionId) {
      const existing = store().chatSessions.find(
        (s) => s.id === sessionId && s.user_id === userId && !s.deleted_at,
      );
      if (existing) return existing;
    }
    const session: ChatSessionRecord = {
      id: createId(),
      user_id: userId,
      title: "Security Copilot",
      context_scan_ids: [],
      created_at: nowIso(),
      updated_at: nowIso(),
      deleted_at: null,
    };
    store().chatSessions.unshift(session);
    return session;
  },
  listMessages(sessionId: string, userId: string) {
    return store().chatMessages.filter(
      (m) => m.session_id === sessionId && m.user_id === userId && !m.deleted_at,
    );
  },
  insertMessage(message: ChatMessageRecord) {
    store().chatMessages.push(message);
    const session = store().chatSessions.find((s) => s.id === message.session_id);
    if (session) session.updated_at = nowIso();
    return message;
  },
  updateSessionContext(sessionId: string, scanIds: string[]) {
    const session = store().chatSessions.find((s) => s.id === sessionId);
    if (session) {
      session.context_scan_ids = scanIds;
      session.updated_at = nowIso();
    }
  },
};
