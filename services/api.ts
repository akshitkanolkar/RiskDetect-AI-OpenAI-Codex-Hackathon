import type { ApiResult } from "@/types";

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl = "") {
    this.baseUrl = baseUrl;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<ApiResult<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        return {
          data: null,
          error: {
            message: body?.error?.message ?? body?.message ?? "Request failed",
            code: body?.error?.code,
            status: response.status,
          },
        };
      }

      return { data: body?.data ?? body, error: null };
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : "Network error",
          status: 0,
        },
      };
    }
  }

  get<T>(path: string, options?: RequestInit) {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  post<T>(path: string, data?: unknown, options?: RequestInit) {
    return this.request<T>(path, {
      ...options,
      method: "POST",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(path: string, data?: unknown, options?: RequestInit) {
    return this.request<T>(path, {
      ...options,
      method: "PUT",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  }

  patch<T>(path: string, data?: unknown, options?: RequestInit) {
    return this.request<T>(path, {
      ...options,
      method: "PATCH",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(path: string, options?: RequestInit) {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
