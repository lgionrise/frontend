export type ApiRecord = Record<string, unknown>;

const API_ROOT = (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1").replace(/\/$/, "");

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("lgion_access");
}

export function getStoredUser(): ApiRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem("lgion_user");
    return value ? (JSON.parse(value) as ApiRecord) : null;
  } catch {
    return null;
  }
}

export async function apiRequest<T = unknown>(path: string, options: RequestInit = {}, retried = false): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${API_ROOT}${path}`, { ...options, headers, cache: "no-store" });
  if (response.status === 401 && !retried && path !== "/auth/token/refresh/") {
    const refresh = typeof window === "undefined" ? null : window.localStorage.getItem("lgion_refresh");
    if (refresh) {
      const refreshResponse = await fetch(`${API_ROOT}/auth/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
        cache: "no-store",
      });
      const refreshed = await refreshResponse.json().catch(() => null) as unknown;
      if (!refreshResponse.ok || !refreshed || typeof refreshed !== "object" || !("access" in refreshed)) {
        window.localStorage.removeItem("lgion_access");
        window.localStorage.removeItem("lgion_refresh");
        throw new Error("Your session expired. Please sign in again.");
      }
      window.localStorage.setItem("lgion_access", String(refreshed.access));
      if ("refresh" in refreshed && refreshed.refresh) window.localStorage.setItem("lgion_refresh", String(refreshed.refresh));
      return apiRequest<T>(path, options, true);
    }
  }
  const body = await response.json().catch(() => null) as unknown;
  if (!response.ok) {
    const record = body && typeof body === "object" ? body as ApiRecord : {};
    const nested = record.error && typeof record.error === "object" ? record.error as ApiRecord : {};
    const message = nested.message ?? record.detail ?? record.message ?? record.non_field_errors;
    throw new Error(Array.isArray(message) ? message.join(", ") : typeof message === "string" ? message : `Request failed (${response.status})`);
  }
  return body as T;
}

export async function requestAuth<T = unknown>(path: string, payload: ApiRecord): Promise<T> {
  return apiRequest<T>(`/auth/${path}/`, { method: "POST", body: JSON.stringify(payload) });
}

export function asList(value: unknown): ApiRecord[] {
  if (Array.isArray(value)) return value.filter((item): item is ApiRecord => !!item && typeof item === "object");
  if (value && typeof value === "object") {
    const record = value as ApiRecord;
    const list = Array.isArray(record.results) ? record.results : record.data;
    if (Array.isArray(list)) return list.filter((item): item is ApiRecord => !!item && typeof item === "object");
  }
  return [];
}

export function displayValue(value: unknown, fallback = "—"): string {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return JSON.stringify(value);
}
