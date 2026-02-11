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
