export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface AlertRecord {
  id: number;
  timestamp: string;
  flow_id: number | null;
  src_ip: string;
  src_port: number | null;
  dest_ip: string;
  dest_port: number | null;
  proto: string | null;
  community_id: string | null;
  app_proto: string | null;
  in_iface: string | null;
  action: string;
  signature_id: number;
  signature: string;
  category: string;
  severity: number;
  gid: number;
  rev: number;
  metadata_json: string | null;
  payload_printable: string | null;
  packet: string | null;
  http_json: string | null;
  dns_json: string | null;
  tls_json: string | null;
  ingested_at: string;
}

export interface FlowRecord {
  id: number;
  timestamp: string;
  flow_id: number | null;
  src_ip: string;
  src_port: number | null;
  dest_ip: string;
  dest_port: number | null;
  proto: string | null;
  community_id: string | null;
  app_proto: string | null;
  pkts_toserver: number;
  pkts_toclient: number;
  bytes_toserver: number;
  bytes_toclient: number;
  flow_start: string | null;
  flow_end: string | null;
  age: number | null;
  state: string | null;
  reason: string | null;
  alerted: boolean;
  ingested_at: string;
}

export interface RawEvent {
  id: number;
  timestamp: string;
  event_type: string;
  raw_json: string;
  ingested_at: string;
}

export interface AlertStats {
  total: number;
  by_severity: Record<string, number>;
  by_category: { category: string; count: number }[];
  top_signatures: { signature: string; sid: number; count: number }[];
  top_src_ips: { ip: string; count: number }[];
  top_dest_ips: { ip: string; count: number }[];
}

export interface FlowStats {
  total: number;
  total_bytes: number;
  by_proto: Record<string, number>;
  top_talkers: { ip: string; bytes: number; flows: number }[];
}

export interface SystemStatus {
  watcher: {
    running: boolean;
    eve_path: string | null;
    lines_processed: number;
    last_event_at: string | null;
  };
  database: {
    status: string;
  };
  auth: {
    current_user: string;
    secure_cookie: boolean;
    session_ttl_hours: number;
    user_count: number;
  };
  transport: {
    secure_ui_origin: string;
  };
}

export interface HealthStatus {
  status: string;
  version: string;
}

export interface AlertExplanationRequest {
  signature: string;
  category?: string | null;
  severity?: number | null;
  src_ip?: string | null;
  dest_ip?: string | null;
  proto?: string | null;
  app_proto?: string | null;
  action?: string | null;
  payload_printable?: string | null;
  http_context?: Record<string, unknown> | null;
  dns_context?: Record<string, unknown> | null;
  tls_context?: Record<string, unknown> | null;
}

export interface AlertExplanationResponse {
  explanation: string;
  sources_found: number;
}

export interface IPBreakdownChart {
  data: Array<Record<string, string | number>>;
  keys: string[];
}

export interface IPChartsResponse {
  by_app_proto: IPBreakdownChart;
  by_category: IPBreakdownChart;
  by_event_type: IPBreakdownChart;
  by_action: IPBreakdownChart;
}

export interface AuthUser {
  id: number;
  username: string;
  is_admin: boolean;
  created_at: string;
  last_login_at: string | null;
}

export interface LoginResponse {
  user: AuthUser;
  expires_at: string;
}

export interface SecurityScenario {
  key: string;
  title: string;
  tactic: string;
  technique: string;
  severity: string;
  description: string;
  signature_ids: number[];
  total_alerts: number;
  last_seen: string | null;
  last_signature: string | null;
  status: "active" | "quiet";
}

export interface SecurityRecentHit {
  id: number;
  timestamp: string;
  signature: string;
  signature_id: number;
  src_ip: string;
  dest_ip: string;
  dest_port: number | null;
  action: string;
  severity: number;
}

export interface SecurityOverview {
  scenarios: SecurityScenario[];
  tactic_breakdown: { tactic: string; count: number }[];
  recent_hits: SecurityRecentHit[];
  top_sources: { ip: string; count: number }[];
}
