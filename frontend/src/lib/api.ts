import type {
  AlertRecord,
  AlertStats,
  FlowRecord,
  FlowStats,
  HealthStatus,
  PaginatedResponse,
  RawEvent,
  SystemStatus,
} from "@/lib/types";

const API_BASE_URL = "/api";

type QueryParams = Record<string, string | number | boolean | undefined | null>;

function buildQuery(params?: QueryParams): string {
  if (!params) return "";
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "");
  if (entries.length === 0) return "";
  const search = new URLSearchParams(entries.map(([key, value]) => [key, String(value)]));
  return `?${search.toString()}`;
}

async function fetchJson<T>(url: string, errorMessage: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(errorMessage);
  return response.json() as Promise<T>;
}

export function fetchAlertStats(): Promise<AlertStats> {
  return fetchJson(`${API_BASE_URL}/alerts/stats`, "Failed to fetch alert stats");
}

export function fetchFlowStats(): Promise<FlowStats> {
  return fetchJson(`${API_BASE_URL}/flows/stats`, "Failed to fetch flow stats");
}

export function fetchAlerts(params?: QueryParams): Promise<PaginatedResponse<AlertRecord>> {
  const query = buildQuery(params);
  return fetchJson(`${API_BASE_URL}/alerts${query}`, "Failed to fetch alerts");
}

export function fetchAlert(alertId: number): Promise<AlertRecord> {
  return fetchJson(`${API_BASE_URL}/alerts/${alertId}`, "Failed to fetch alert");
}

export function fetchFlows(params?: QueryParams): Promise<PaginatedResponse<FlowRecord>> {
  const query = buildQuery(params);
  return fetchJson(`${API_BASE_URL}/flows${query}`, "Failed to fetch flows");
}

export function fetchEvents(params?: QueryParams): Promise<PaginatedResponse<RawEvent>> {
  const query = buildQuery(params);
  return fetchJson(`${API_BASE_URL}/events${query}`, "Failed to fetch events");
}

export function fetchStatus(): Promise<SystemStatus> {
  return fetchJson(`${API_BASE_URL}/status`, "Failed to fetch system status");
}

export function fetchHealth(): Promise<HealthStatus> {
  return fetchJson(`${API_BASE_URL}/health`, "Failed to fetch health status");
}