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

export function fetchAlertStats() {
  return fetchJson(`${API_BASE_URL}/alerts/stats`, "Failed to fetch alert stats");
}

export function fetchFlowStats() {
  return fetchJson(`${API_BASE_URL}/flows/stats`, "Failed to fetch flow stats");
}

export function fetchAlerts(params?: QueryParams) {
  const query = buildQuery(params);
  return fetchJson(`${API_BASE_URL}/alerts${query}`, "Failed to fetch alerts");
}

export function fetchAlert(alertId: number) {
  return fetchJson(`${API_BASE_URL}/alerts/${alertId}`, "Failed to fetch alert");
}

export function fetchFlows(params?: QueryParams) {
  const query = buildQuery(params);
  return fetchJson(`${API_BASE_URL}/flows${query}`, "Failed to fetch flows");
}

export function fetchEvents(params?: QueryParams) {
  const query = buildQuery(params);
  return fetchJson(`${API_BASE_URL}/events${query}`, "Failed to fetch events");
}

export function fetchStatus() {
  return fetchJson(`${API_BASE_URL}/status`, "Failed to fetch system status");
}

export function fetchHealth() {
  return fetchJson(`${API_BASE_URL}/health`, "Failed to fetch health status");
}