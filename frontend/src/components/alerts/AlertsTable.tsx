"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import type { AlertRecord, PaginatedResponse } from "@/lib/types";
import { fetchAlerts } from "@/lib/api";
import { formatTimestamp, protocolColor } from "@/lib/utils";
import SeverityBadge from "@/components/alerts/SeverityBadge";

export default function AlertsTable() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [severity, setSeverity] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const params: Record<string, string> = { page: String(page), per_page: "25" };
  if (severity) params.severity = severity;
  if (search) params.search = search;

  const { data, error, isLoading } = useSWR<PaginatedResponse<AlertRecord>>(
    ["alerts", page, severity, search],
    () => fetchAlerts(params),
    { refreshInterval: 10000 }
  );

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setSearch(searchInput);
      setPage(1);
    },
    [searchInput]
  );

  const handleSeverityChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSeverity(e.target.value);
      setPage(1);
    },
    []
  );

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-700/50 bg-zinc-800/50 p-4">
        <select
          value={severity}
          onChange={handleSeverityChange}
          className="rounded-md border border-zinc-600 bg-zinc-700 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-green-500/50"
        >
          <option value="">All Severities</option>
          <option value="1">High</option>
          <option value="2">Medium</option>
          <option value="3">Low</option>
        </select>
        <form onSubmit={handleSearch} className="flex flex-1 gap-2 min-w-50">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search signatures, IPs..."
            className="flex-1 rounded-md border border-zinc-600 bg-zinc-700 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-green-500/50"
          />
          <button
            type="submit"
            className="rounded-md bg-zinc-600 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-500 transition-colors"
          >
            Search
          </button>
        </form>
        {search && (
          <button
            onClick={() => {
              setSearch("");
              setSearchInput("");
              setPage(1);
            }}
            className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          Failed to load alerts: {error.message}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-700/50">
          <table className="w-full text-sm text-left">
            <thead className="sticky top-0 z-10 bg-zinc-800 text-xs uppercase text-zinc-400 border-b border-zinc-700/50">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Severity</th>
                <th className="px-4 py-3 font-medium">Signature</th>
                <th className="px-4 py-3 font-medium">Src IP:Port</th>
                <th className="px-4 py-3 font-medium">Dest IP:Port</th>
                <th className="px-4 py-3 font-medium">Proto</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700/30">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-500 border-t-zinc-300" />
                      Loading...
                    </span>
                  </td>
                </tr>
              ) : data && data.items.length > 0 ? (
                data.items.map((alert) => (
                  <tr
                    key={alert.id}
                    onClick={() => router.push(`/alerts/${alert.id}`)}
                    className="cursor-pointer bg-zinc-900/50 hover:bg-zinc-700/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                      {alert.id}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-300 whitespace-nowrap">
                      {formatTimestamp(alert.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <SeverityBadge severity={alert.severity} />
                    </td>
                    <td className="px-4 py-3 text-zinc-300 max-w-xs truncate">
                      {alert.signature}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400 whitespace-nowrap">
                      {alert.src_ip}
                      {alert.src_port != null ? `:${alert.src_port}` : ""}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400 whitespace-nowrap">
                      {alert.dest_ip}
                      {alert.dest_port != null ? `:${alert.dest_port}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${protocolColor(alert.proto)}`}
                      >
                        {alert.proto ?? "--"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-zinc-300 uppercase">
                      {alert.action}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-zinc-500"
                  >
                    No alerts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-4 py-3">
          <p className="text-xs text-zinc-400">
            Showing page {data.page} of {data.pages} ({data.total} total alerts)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-md border border-zinc-600 bg-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            {generatePageNumbers(data.page, data.pages).map((p, i) =>
              p === null ? (
                <span key={`ellipsis-${i}`} className="text-zinc-500 px-1">
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    p === page
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "border border-zinc-600 bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                  }`}
                >
                  {p}
                </button>
              )
            )}
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

function generatePageNumbers(
  current: number,
  total: number
): (number | null)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | null)[] = [1];
  if (current > 3) pages.push(null);
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push(null);
  pages.push(total);
  return pages;
}
