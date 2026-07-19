import { isSupabaseConfigured } from "@/lib/env";
import { createServerClient } from "@/lib/supabase/server";
import { createId, memoryDb, nowIso } from "@/lib/db/memory";
import type { ImageScanRecord, RiskHistoryRecord, UnifiedScan, UrlScanRecord } from "@/types/scans";

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
  // Always keep a full copy in memory so the viewer works in demo mode.
  memoryDb.insertImageScan(record);

  if (!isSupabaseConfigured()) {
    return record;
  }

  const client = await supabase();
  const { data, error } = await client.from("image_scans").insert(record).select().single();
  if (!error && data) {
    return data as ImageScanRecord;
  }

  // Retry without the heavy preview payload if the column is missing or payload is too large.
  const { image_data_url: _omit, ...withoutPreview } = record;
  void _omit;
  const retry = await client.from("image_scans").insert(withoutPreview).select().single();
  if (!retry.error && retry.data) {
    return { ...(retry.data as ImageScanRecord), image_data_url: record.image_data_url };
  }

  return record;
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
  const memory = memoryDb.getImageScan(id, userId);
  if (!isSupabaseConfigured()) {
    return memory;
  }
  const client = await supabase();
  const { data, error } = await client
    .from("image_scans")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error || !data) return memory;
  const row = data as ImageScanRecord;
  return {
    ...row,
    image_data_url: row.image_data_url ?? memory?.image_data_url ?? null,
    image_width: row.image_width ?? memory?.image_width ?? null,
    image_height: row.image_height ?? memory?.image_height ?? null,
    findings: row.findings?.length ? row.findings : (memory?.findings ?? []),
  };
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
