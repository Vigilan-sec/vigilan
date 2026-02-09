"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import type { RawEvent, PaginatedResponse } from "@/lib/types";
import { fetchEvents } from "@/lib/api";
import { formatTimestamp } from "@/lib/utils";

const eventTypeColors: Record<string, string> = {
  alert: "bg-red-500/20 text-red-400",
  flow: "bg-blue-500/20 text-blue-400",
  dns: "bg-cyan-500/20 text-cyan-400",
  http: "bg-green-500/20 text-green-400",
  tls: "bg-purple-500/20 text-purple-400",
  fileinfo: "bg-orange-500/20 text-orange-400",
  stats: "bg-zinc-500/20 text-zinc-400",
  anomaly: "bg-yellow-500/20 text-yellow-400",
  ssh: "bg-indigo-500/20 text-indigo-400",
  smtp: "bg-pink-500/20 text-pink-400",
};

function getEventTypeColor(type: string): string {
  return eventTypeColors[type.toLowerCase()] ?? "bg-zinc-500/20 text-zinc-300";
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
              <span className="inline-flex items-center gap-2 text-sm text-zinc-500">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-500 border-t-zinc-300" />
                Loading events...
              </span>
            </div>
          ) : data && data.items.length > 0 ? (
            data.items.map((event) => {
              const isExpanded = expandedRows.has(event.id);
              return (
                <div
                  key={event.id}
                  className="rounded-lg border border-zinc-700/50 bg-zinc-800/50 overflow-hidden"
                >
                  {/* Row Header */}
                  <button
                    onClick={() => toggleRow(event.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-zinc-700/40 transition-colors"
                  >
                    <span
                      className={`transform transition-transform text-zinc-500 text-xs ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                    >
                      &#9654;
                    </span>
                    <span className="font-mono text-xs text-zinc-400 w-28 shrink-0">
                      {formatTimestamp(event.timestamp)}
                    </span>
                    <span
                      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium w-20 justify-center shrink-0 ${getEventTypeColor(event.event_type)}`}
                    >
                      {event.event_type}
                    </span>
                    <span className="font-mono text-xs text-zinc-500 truncate">
                      {event.raw_json.length > 120
                        ? event.raw_json.slice(0, 120) + "..."
                        : event.raw_json}
                    </span>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-zinc-700/50 bg-zinc-900/80 p-4">
                      <div className="mb-2 flex items-center gap-4 text-xs text-zinc-500">
                        <span>
                          ID: <span className="font-mono text-zinc-400">{event.id}</span>
                        </span>
                        <span>
                          Ingested:{" "}
                          <span className="font-mono text-zinc-400">
                            {formatTimestamp(event.ingested_at)}
                          </span>
                        </span>
                      </div>
                      <pre className="overflow-x-auto rounded border border-zinc-700/30 bg-zinc-950 p-4 text-xs font-mono text-zinc-300 leading-relaxed max-h-96 overflow-y-auto">
                        {formatJson(event.raw_json)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-4 py-8 text-center text-zinc-500 text-sm">
              No events found
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-4 py-3">
          <p className="text-xs text-zinc-400">
            Showing page {data.page} of {data.pages} ({data.total} total events)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-md border border-zinc-600 bg-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-xs font-mono text-zinc-400">
              {data.page} / {data.pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
              disabled={page >= data.pages}
              className="rounded-md border border-zinc-600 bg-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
