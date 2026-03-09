"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import type { FlowRecord, PaginatedResponse } from "@/lib/types";
import { fetchFlows } from "@/lib/api";
import { formatTimestamp, protocolColor, formatBytes, formatNumber } from "@/lib/utils";

export default function FlowsTable() {
  const [page, setPage] = useState(1);
  const [isResizing, setIsResizing] = useState(false);
  const [colWidths, setColWidths] = useState<number[]>([
    170, 90, 180, 180, 120, 120, 90, 90, 90, 90,
  ]);
  const resizeState = useRef<{
    index: number;
    startX: number;
    startWidth: number;
  } | null>(null);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!resizeState.current) return;
      const { index, startX, startWidth } = resizeState.current;
      const delta = event.clientX - startX;
      setColWidths((prev) => {
        const next = [...prev];
        next[index] = Math.max(80, startWidth + delta);
        return next;
      });
    };

    const handleMouseUp = () => {
      if (!resizeState.current) return;
      resizeState.current = null;
      setIsResizing(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  useEffect(() => {
    document.body.style.cursor = isResizing ? "col-resize" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [isResizing]);

  const handleResizeStart = (index: number, event: React.MouseEvent) => {
    event.preventDefault();
    resizeState.current = {
      index,
      startX: event.clientX,
      startWidth: colWidths[index],
    };
    setIsResizing(true);
  };

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
        <div className="overflow-x-auto rounded-lg border border-app">
          <table className="w-full text-sm text-left table-fixed">
            <thead className="sticky top-0 z-10 surface-2 text-xs uppercase text-muted border-b border-app">
              <tr>
                {[
                  "Time",
                  "Proto",
                  "Source",
                  "Destination",
                  "Bytes \u2191",
                  "Bytes \u2193",
                  "Pkts \u2191",
                  "Pkts \u2193",
                  "Duration",
                  "State",
                ].map((label, index) => (
                  <th
                    key={label}
                    className={`relative px-4 py-3 font-medium ${
                      index >= 4 && index <= 8 ? "text-right" : ""
                    }`}
                    style={{ width: colWidths[index] }}
                  >
                    {label}
                    <span
                      onMouseDown={(event) => handleResizeStart(index, event)}
                      className="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--border)]">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-subtle">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[color:var(--border)] border-t-[color:var(--text-strong)]" />
                      Loading...
                    </span>
                  </td>
                </tr>
              ) : data && data.items.length > 0 ? (
                data.items.map((flow) => (
                  <tr
                    key={flow.id}
                    className="surface-1 hover-surface-3 transition-colors"
                  >
                    <td
                      className="px-4 py-3 font-mono text-xs text-muted whitespace-nowrap"
                      style={{ width: colWidths[0] }}
                    >
                      {formatTimestamp(flow.timestamp)}
                    </td>
                    <td className="px-4 py-3" style={{ width: colWidths[1] }}>
                      <span
                        className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${protocolColor(flow.proto)}`}
                      >
                        {flow.proto ?? "--"}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 font-mono text-xs text-subtle whitespace-nowrap"
                      style={{ width: colWidths[2] }}
                    >
                      {flow.src_ip}
                      {flow.src_port != null ? `:${flow.src_port}` : ""}
                    </td>
                    <td
                      className="px-4 py-3 font-mono text-xs text-subtle whitespace-nowrap"
                      style={{ width: colWidths[3] }}
                    >
                      {flow.dest_ip}
                      {flow.dest_port != null ? `:${flow.dest_port}` : ""}
                    </td>
                    <td
                      className="px-4 py-3 font-mono text-xs text-muted text-right whitespace-nowrap"
                      style={{ width: colWidths[4] }}
                    >
                      {formatBytes(flow.bytes_toserver)}
                    </td>
                    <td
                      className="px-4 py-3 font-mono text-xs text-muted text-right whitespace-nowrap"
                      style={{ width: colWidths[5] }}
                    >
                      {formatBytes(flow.bytes_toclient)}
                    </td>
                    <td
                      className="px-4 py-3 font-mono text-xs text-subtle text-right"
                      style={{ width: colWidths[6] }}
                    >
                      {formatNumber(flow.pkts_toserver)}
                    </td>
                    <td
                      className="px-4 py-3 font-mono text-xs text-subtle text-right"
                      style={{ width: colWidths[7] }}
                    >
                      {formatNumber(flow.pkts_toclient)}
                    </td>
                    <td
                      className="px-4 py-3 font-mono text-xs text-subtle text-right whitespace-nowrap"
                      style={{ width: colWidths[8] }}
                    >
                      {flow.age != null ? `${flow.age}s` : "--"}
                    </td>
                    <td className="px-4 py-3" style={{ width: colWidths[9] }}>
                      <FlowStateBadge state={flow.state} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-8 text-center text-subtle"
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
        <div className="flex items-center justify-between rounded-lg border border-app surface-2 px-4 py-3">
          <p className="text-xs text-muted">
            Showing page {data.page} of {data.pages} ({data.total} total flows)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-md border px-3 py-1.5 text-xs input-base hover-surface-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            {generatePageNumbers(data.page, data.pages).map((p, i) =>
              p === null ? (
                <span key={`ellipsis-${i}`} className="text-subtle px-1">
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    p === page
                      ? "accent-chip border"
                      : "border input-base hover-surface-3"
                  }`}
                >
                  {p}
                </button>
              )
            )}
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

function FlowStateBadge({ state }: { state: string | null }) {
  if (!state) return <span className="text-xs text-subtle">--</span>;

  const colorMap: Record<string, string> = {
    new: "bg-green-500/20 text-green-400",
    established: "bg-blue-500/20 text-blue-400",
    closed: "chip-muted",
  };

  const color = colorMap[state.toLowerCase()] ?? "chip-muted";

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
