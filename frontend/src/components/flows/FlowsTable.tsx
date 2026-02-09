"use client";

import { useState } from "react";
import useSWR from "swr";
import type { FlowRecord, PaginatedResponse } from "@/lib/types";
import { fetchFlows } from "@/lib/api";
import { formatTimestamp, protocolColor, formatBytes, formatNumber } from "@/lib/utils";

export default function FlowsTable() {
  const [page, setPage] = useState(1);

  const params: Record<string, string> = {
    page: String(page),
    per_page: "25",
  };

  const { data, error, isLoading } = useSWR<PaginatedResponse<FlowRecord>>(
    ["flows", page],
    () => fetchFlows(params),
    { refreshInterval: 10000 }
  );

  return (
    <div className="space-y-4">
      {/* Table */}
      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          Failed to load flows: {error.message}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-700/50">
          <table className="w-full text-sm text-left">
            <thead className="sticky top-0 z-10 bg-zinc-800 text-xs uppercase text-zinc-400 border-b border-zinc-700/50">
              <tr>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Proto</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Destination</th>
                <th className="px-4 py-3 font-medium text-right">
                  Bytes &uarr;
                </th>
                <th className="px-4 py-3 font-medium text-right">
                  Bytes &darr;
                </th>
                <th className="px-4 py-3 font-medium text-right">
                  Pkts &uarr;
                </th>
                <th className="px-4 py-3 font-medium text-right">
                  Pkts &darr;
                </th>
                <th className="px-4 py-3 font-medium text-right">Duration</th>
                <th className="px-4 py-3 font-medium">State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700/30">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-zinc-500">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-500 border-t-zinc-300" />
                      Loading...
                    </span>
                  </td>
                </tr>
              ) : data && data.items.length > 0 ? (
                data.items.map((flow) => (
                  <tr
                    key={flow.id}
                    className="bg-zinc-900/50 hover:bg-zinc-700/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-zinc-300 whitespace-nowrap">
                      {formatTimestamp(flow.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${protocolColor(flow.proto)}`}
                      >
                        {flow.proto ?? "--"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400 whitespace-nowrap">
                      {flow.src_ip}
                      {flow.src_port != null ? `:${flow.src_port}` : ""}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400 whitespace-nowrap">
                      {flow.dest_ip}
                      {flow.dest_port != null ? `:${flow.dest_port}` : ""}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-300 text-right whitespace-nowrap">
                      {formatBytes(flow.bytes_toserver)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-300 text-right whitespace-nowrap">
                      {formatBytes(flow.bytes_toclient)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400 text-right">
                      {formatNumber(flow.pkts_toserver)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400 text-right">
                      {formatNumber(flow.pkts_toclient)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400 text-right whitespace-nowrap">
                      {flow.age != null ? `${flow.age}s` : "--"}
                    </td>
                    <td className="px-4 py-3">
                      <FlowStateBadge state={flow.state} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-8 text-center text-zinc-500"
                  >
                    No flows found
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
            Showing page {data.page} of {data.pages} ({data.total} total flows)
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

function FlowStateBadge({ state }: { state: string | null }) {
  if (!state) return <span className="text-xs text-zinc-500">--</span>;

  const colorMap: Record<string, string> = {
    new: "bg-green-500/20 text-green-400",
    established: "bg-blue-500/20 text-blue-400",
    closed: "bg-zinc-500/20 text-zinc-400",
  };

  const color = colorMap[state.toLowerCase()] ?? "bg-zinc-500/20 text-zinc-300";

  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${color}`}
    >
      {state}
    </span>
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
