import { isSupabaseConfigured } from "@/lib/env";
import { createServerClient } from "@/lib/supabase/server";
import { createId, memoryDb, nowIso } from "@/lib/db/memory";
import type {
  ImageScanRecord,
  RiskHistoryRecord,
  UnifiedScan,
  UrlScanRecord,
} from "@/types/scans";

async function supabase() {
  return createServerClient();
}

export async function saveUrlScan(record: UrlScanRecord): Promise<UrlScanRecord> {
  if (!isSupabaseConfigured()) {
    return memoryDb.insertUrlScan(record);
  }

  const client = await supabase();
  const { data, error } = await client.from("url_scans").insert(record).select().single();
  if (error) {
    // Fall back so demos still work before migrations are applied
    return memoryDb.insertUrlScan(record);
  }
  return data as UrlScanRecord;
}

export async function saveImageScan(record: ImageScanRecord): Promise<ImageScanRecord> {
  if (!isSupabaseConfigured()) {
    return memoryDb.insertImageScan(record);
  }

  const client = await supabase();
  const { data, error } = await client.from("image_scans").insert(record).select().single();
  if (error) {
    return memoryDb.insertImageScan(record);
  }
  return data as ImageScanRecord;
}

export async function saveRiskHistory(input: Omit<RiskHistoryRecord, "id" | "deleted_at">) {
  const record: RiskHistoryRecord = {
    ...input,
    id: createId(),
    deleted_at: null,
  };

  if (!isSupabaseConfigured()) {
    return memoryDb.insertRiskHistory(record);
  }

  const client = await supabase();
  const { error } = await client.from("risk_history").insert(record);
  if (error) {
    return memoryDb.insertRiskHistory(record);
  }
  return record;
}

export async function getUrlScanById(id: string, userId: string) {
  if (!isSupabaseConfigured()) {
    return memoryDb.getUrlScan(id, userId);
  }
  const client = await supabase();
  const { data, error } = await client
    .from("url_scans")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error || !data) return memoryDb.getUrlScan(id, userId);
  return data as UrlScanRecord;
}

export async function getImageScanById(id: string, userId: string) {
  if (!isSupabaseConfigured()) {
    return memoryDb.getImageScan(id, userId);
  }
  const client = await supabase();
  const { data, error } = await client
    .from("image_scans")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error || !data) return memoryDb.getImageScan(id, userId);
  return data as ImageScanRecord;
}

export async function listUserHistory(
  userId: string,
  type: "all" | "url" | "image" = "all",
  limit = 25,
): Promise<UnifiedScan[]> {
  let urlScans: UrlScanRecord[] = [];
  let imageScans: ImageScanRecord[] = [];

  if (!isSupabaseConfigured()) {
    urlScans = memoryDb.listUrlScans(userId);
    imageScans = memoryDb.listImageScans(userId);
  } else {
    const client = await supabase();
    if (type === "all" || type === "url") {
      const { data } = await client
        .from("url_scans")
        .select("*")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(limit);
      urlScans = (data as UrlScanRecord[] | null) ?? memoryDb.listUrlScans(userId);
    }
    if (type === "all" || type === "image") {
      const { data } = await client
        .from("image_scans")
        .select("*")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(limit);
      imageScans = (data as ImageScanRecord[] | null) ?? memoryDb.listImageScans(userId);
    }
  }

  const unified: UnifiedScan[] = [
    ...urlScans.map((s) => ({ ...s, scan_type: "url" as const })),
    ...imageScans.map((s) => ({ ...s, scan_type: "image" as const })),
  ].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));

  return unified.slice(0, limit);
}

export async function listRiskHistory(userId: string) {
  if (!isSupabaseConfigured()) {
    return memoryDb.listRiskHistory(userId);
  }
  const client = await supabase();
  const { data, error } = await client
    .from("risk_history")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("recorded_at", { ascending: false })
    .limit(90);
  if (error || !data) return memoryDb.listRiskHistory(userId);
  return data as RiskHistoryRecord[];
}

export { createId, nowIso };
