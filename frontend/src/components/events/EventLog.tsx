"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import type { RawEvent, PaginatedResponse } from "@/lib/types";
import { fetchEvents } from "@/lib/api";
import { formatTimestamp } from "@/lib/utils";

const eventTypeColors: Record<string, string> = {
  alert: "bg-red-500/20 text-red-400",
  dns: "bg-cyan-500/20 text-cyan-400",
  http: "bg-green-500/20 text-green-400",
  tls: "bg-purple-500/20 text-purple-400",
  fileinfo: "bg-orange-500/20 text-orange-400",
  anomaly: "bg-yellow-500/20 text-yellow-400",
  ssh: "bg-indigo-500/20 text-indigo-400",
  smtp: "bg-pink-500/20 text-pink-400",
};

function getEventTypeColor(type: string): string {
  return eventTypeColors[type.toLowerCase()] ?? "chip-muted";
}

export default function EventLog() {
  const [page, setPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const params: Record<string, string> = {
    page: String(page),
    per_page: "30",
  };

  const { data, error, isLoading } = useSWR<PaginatedResponse<RawEvent>>(
    ["events", page],
    () => fetchEvents(params),
    { refreshInterval: 10000 }
  );

  const toggleRow = useCallback((id: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const formatJson = (raw: string): string => {
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw;
    }
  };

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          Failed to load events: {error.message}
        </div>
      ) : (
        <div className="space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <span className="inline-flex items-center gap-2 text-sm text-subtle">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[color:var(--border)] border-t-[color:var(--text-strong)]" />
                Loading events...
              </span>
            </div>
          ) : data && data.items.length > 0 ? (
            data.items.map((event) => {
              const isExpanded = expandedRows.has(event.id);
              return (
                <div
                  key={event.id}
                  className="rounded-lg border border-app surface-2 overflow-hidden"
                >
                  {/* Row Header */}
                  <button
                    onClick={() => toggleRow(event.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover-surface-3 transition-colors"
                  >
                    <span
                      className={`transform transition-transform text-subtle text-xs ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                    >
                      &#9654;
                    </span>
                    <span className="font-mono text-xs text-muted w-28 shrink-0">
                      {formatTimestamp(event.timestamp)}
                    </span>
                    <span
                      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium w-20 justify-center shrink-0 ${getEventTypeColor(event.event_type)}`}
                    >
                      {event.event_type}
                    </span>
                    <span className="font-mono text-xs text-subtle truncate">
                      {event.raw_json.length > 120
                        ? event.raw_json.slice(0, 120) + "..."
                        : event.raw_json}
                    </span>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-app surface-1 p-4">
                      <div className="mb-2 flex items-center gap-4 text-xs text-subtle">
                        <span>
                          ID: <span className="font-mono text-muted">{event.id}</span>
                        </span>
                        <span>
                          Ingested:{" "}
                          <span className="font-mono text-muted">
                            {formatTimestamp(event.ingested_at)}
                          </span>
                        </span>
                      </div>
                      <pre className="overflow-x-auto rounded border border-app surface-2 p-4 text-xs font-mono text-muted leading-relaxed max-h-96 overflow-y-auto">
                        {formatJson(event.raw_json)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="rounded-lg border border-app surface-2 px-4 py-8 text-center text-subtle text-sm">
              No events found
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between rounded-lg border border-app surface-2 px-4 py-3">
          <p className="text-xs text-muted">
            Showing page {data.page} of {data.pages} ({data.total} total events)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-md border px-3 py-1.5 text-xs input-base hover-surface-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-xs font-mono text-muted">
              {data.page} / {data.pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
              disabled={page >= data.pages}
              className="rounded-md border px-3 py-1.5 text-xs input-base hover-surface-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
