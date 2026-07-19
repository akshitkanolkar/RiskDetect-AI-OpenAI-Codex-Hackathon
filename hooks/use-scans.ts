"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/api";
import { QUERY_KEYS } from "@/constants";
import { ROUTES } from "@/constants/routes";
import type { DashboardData, ImageScanRecord, UnifiedScan, UrlScanRecord } from "@/types/scans";
import type { ChatMessageRecord } from "@/types/scans";

export function useDashboard() {
  return useQuery({
    queryKey: QUERY_KEYS.DASHBOARD,
    queryFn: async () => {
      const result = await apiClient.get<DashboardData>(ROUTES.API.DASHBOARD);
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
  });
}

export function useHistory(type: "all" | "url" | "image" = "all") {
  return useQuery({
    queryKey: [...QUERY_KEYS.HISTORY, type],
    queryFn: async () => {
      const result = await apiClient.get<UnifiedScan[]>(
        `${ROUTES.API.HISTORY}?type=${type}&limit=50`,
      );
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
  });
}

export function useScanDetail(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.SCAN(id),
    enabled: Boolean(id),
    queryFn: async () => {
      const result = await apiClient.get<UnifiedScan>(`${ROUTES.API.HISTORY}?id=${id}`);
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
  });
}

export function useUrlScan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (url: string) => {
      const result = await apiClient.post<UrlScanRecord>(ROUTES.API.SCAN_URL, { url });
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HISTORY });
    },
  });
}

export function useImageScan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch(ROUTES.API.SCAN_IMAGE, {
        method: "POST",
        body: form,
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.error?.message ?? "Image scan failed");
      }
      return body.data as ImageScanRecord;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HISTORY });
    },
  });
}

export function useChat(sessionId?: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...QUERY_KEYS.CHAT, sessionId ?? "new"],
    queryFn: async () => {
      const qs = sessionId ? `?sessionId=${sessionId}` : "";
      const result = await apiClient.get<{
        sessionId: string;
        messages: ChatMessageRecord[];
      }>(`${ROUTES.API.CHAT}${qs}`);
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
  });

  const send = useMutation({
    mutationFn: async (input: {
      message: string;
      sessionId?: string | null;
      mode?: "simple" | "technical" | "checklist";
    }) => {
      const result = await apiClient.post<{
        sessionId: string;
        message: ChatMessageRecord;
        messages: ChatMessageRecord[];
      }>(ROUTES.API.CHAT, input);
      if (result.error) throw new Error(result.error.message);
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData([...QUERY_KEYS.CHAT, data.sessionId], {
        sessionId: data.sessionId,
        messages: data.messages,
      });
    },
  });

  return { ...query, send };
}
