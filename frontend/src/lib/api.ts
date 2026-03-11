import type {
  AlertRecord,
  AlertStats,
  AuthUser,
  AssistantChatRequest,
  AssistantChatResponse,
  CreateUserPayload,
  FlowRecord,
  FlowStats,
  HealthStatus,
  IPChartsResponse,
  LoginResponse,
  ManagedUser,
  NetworkOverview,
  PaginatedResponse,
  RawEvent,
  SecurityOverview,
  SystemStatus,
  UpdateUserPayload,
  AlertExplanationRequest,
  AlertExplanationResponse,
} from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type QueryParams = Record<string, string | number | boolean | undefined | null>;

function buildQuery(params?: QueryParams): string {
  if (!params) return "";
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null && value !== "",
  );
  if (entries.length === 0) return "";
  const search = new URLSearchParams(
    entries.map(([key, value]) => [key, String(value)]),
  );
  return `?${search.toString()}`;
}

async function fetchJson<T>(
  url: string,
  errorMessage: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    credentials: "include",
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!response.ok) {
    let detail = errorMessage;
    try {
      const payload = (await response.json()) as { detail?: string };
      detail = payload.detail || errorMessage;
    } catch {
      // keep default message
    }
    throw new ApiError(detail, response.status);
  }
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export function fetchAlertStats(): Promise<AlertStats> {
  return fetchJson(
    `${API_BASE_URL}/alerts/stats`,
    "Failed to fetch alert stats",
  );
}

export function fetchFlowStats(): Promise<FlowStats> {
  return fetchJson(`${API_BASE_URL}/flows/stats`, "Failed to fetch flow stats");
}

export function fetchIPCharts(): Promise<IPChartsResponse> {
  return fetchJson(
    `${API_BASE_URL}/charts/ip-breakdown`,
    "Failed to fetch IP breakdown charts",
  );
}

export function fetchAlerts(
  params?: QueryParams,
): Promise<PaginatedResponse<AlertRecord>> {
  const query = buildQuery(params);
  return fetchJson(`${API_BASE_URL}/alerts${query}`, "Failed to fetch alerts");
}

export function fetchAlert(alertId: number): Promise<AlertRecord> {
  return fetchJson(
    `${API_BASE_URL}/alerts/${alertId}`,
    "Failed to fetch alert",
  );
}

export function fetchFlows(
  params?: QueryParams,
): Promise<PaginatedResponse<FlowRecord>> {
  const query = buildQuery(params);
  return fetchJson(`${API_BASE_URL}/flows${query}`, "Failed to fetch flows");
}

export function fetchEvents(
  params?: QueryParams,
): Promise<PaginatedResponse<RawEvent>> {
  const query = buildQuery(params);
  return fetchJson(`${API_BASE_URL}/events${query}`, "Failed to fetch events");
}

export function fetchStatus(): Promise<SystemStatus> {
  return fetchJson(`${API_BASE_URL}/status`, "Failed to fetch system status");
}

export function fetchHealth(): Promise<HealthStatus> {
  return fetchJson(`${API_BASE_URL}/health`, "Failed to fetch health status");
}

export async function explainAlert(
  request: AlertExplanationRequest,
): Promise<AlertExplanationResponse> {
  return fetchJson(`${API_BASE_URL}/rag/explain-alert`, "Failed to explain alert", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });
}

export async function chatWithAssistant(
  request: AssistantChatRequest,
): Promise<AssistantChatResponse> {
  return fetchJson(
    `${API_BASE_URL}/rag/assistant-chat`,
    "Failed to contact assistant",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    },
  );
}

export function fetchCurrentUser(): Promise<AuthUser> {
  return fetchJson(`${API_BASE_URL}/auth/me`, "Failed to fetch current user");
}

export function login(payload: {
  username: string;
  password: string;
}): Promise<LoginResponse> {
  return fetchJson(`${API_BASE_URL}/auth/login`, "Failed to sign in", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export function logout(): Promise<{ ok: boolean }> {
  return fetchJson(`${API_BASE_URL}/auth/logout`, "Failed to sign out", {
    method: "POST",
  });
}

export function fetchSecurityOverview(): Promise<SecurityOverview> {
  return fetchJson(
    `${API_BASE_URL}/security/overview`,
    "Failed to fetch security overview",
  );
}

export function fetchUsers(): Promise<ManagedUser[]> {
  return fetchJson(`${API_BASE_URL}/users`, "Failed to fetch users");
}

export function createUser(payload: CreateUserPayload): Promise<ManagedUser> {
  return fetchJson(`${API_BASE_URL}/users`, "Failed to create user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export function updateUser(userId: number, payload: UpdateUserPayload): Promise<ManagedUser> {
  return fetchJson(`${API_BASE_URL}/users/${userId}`, "Failed to update user", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export function fetchNetworkOverview(): Promise<NetworkOverview> {
  return fetchJson(
    `${API_BASE_URL}/network/overview`,
    "Failed to fetch network overview",
  );
}
