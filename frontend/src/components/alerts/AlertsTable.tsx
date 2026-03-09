"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import type { AlertRecord, PaginatedResponse } from "@/lib/types";
import { fetchAlerts } from "@/lib/api";
import { formatTimestamp, protocolColor } from "@/lib/utils";
import SeverityBadge from "@/components/alerts/SeverityBadge";
import ExplanationModal from "@/components/alerts/ExplanationModal";

export default function AlertsTable() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [severity, setSeverity] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedAlert, setSelectedAlert] = useState<AlertRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [colWidths, setColWidths] = useState<number[]>([
    70, 170, 110, 280, 170, 170, 90, 100, 100,
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
        next[index] = Math.max(70, startWidth + delta);
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

  const params: Record<string, string> = { page: String(page), per_page: "25" };
  if (severity) params.severity = severity;
  if (search) params.search = search;

  const { data, error, isLoading } = useSWR<PaginatedResponse<AlertRecord>>(
    ["alerts", page, severity, search],
    () => fetchAlerts(params),
    { refreshInterval: 10000 },
  );

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setSearch(searchInput);
      setPage(1);
    },
    [searchInput],
  );

  const handleSeverityChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSeverity(e.target.value);
      setPage(1);
    },
    [],
  );

  const handleExplain = useCallback(
    (e: React.MouseEvent, alert: AlertRecord) => {
      e.stopPropagation();
      setSelectedAlert(alert);
      setIsModalOpen(true);
    },
    [],
  );

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-app surface-2 p-4">
        <select
          value={severity}
          onChange={handleSeverityChange}
          className="rounded-md border px-3 py-2 text-sm input-base"
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
            className="flex-1 rounded-md border px-3 py-2 text-sm input-base"
          />
          <button
            type="submit"
            className="rounded-md px-4 py-2 text-sm font-medium btn-base transition-colors"
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
            className="text-xs text-muted hover:text-strong transition-colors"
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
        <div className="overflow-x-auto rounded-lg border border-app">
          <table className="w-full text-sm text-left table-fixed">
            <thead className="sticky top-0 z-10 surface-2 text-xs uppercase text-muted border-b border-app">
              <tr>
                {[
                  "ID",
                  "Time",
                  "Severity",
                  "Signature",
                  "Src IP:Port",
                  "Dest IP:Port",
                  "Proto",
                  "Action",
                ].map((label, index) => (
                  <th
                    key={label}
                    className="relative px-4 py-3 font-medium"
                    style={{ width: colWidths[index] }}
                  >
                    {label}
                    <span
                      onMouseDown={(event) => handleResizeStart(index, event)}
                      className="absolute right-0 top-0 h-full w-2 cursor-col-resize"
                    />
                  </th>
                ))}
                <th
                  className="px-4 py-3 font-medium text-center"
                  style={{ width: colWidths[8] }}
                >
                  Explain
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--border)]">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-subtle">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[color:var(--border)] border-t-[color:var(--text-strong)]" />
                      Loading...
                    </span>
                  </td>
                </tr>
              ) : data && data.items.length > 0 ? (
                data.items.map((alert) => (
                  <tr
                    key={alert.id}
                    onClick={() => router.push(`/alerts/${alert.id}`)}
                    className="cursor-pointer surface-1 hover-surface-3 transition-colors"
                  >
                    <td
                      className="px-4 py-3 font-mono text-xs text-subtle"
                      style={{ width: colWidths[0] }}
                    >
                      {alert.id}
                    </td>
                    <td
                      className="px-4 py-3 font-mono text-xs text-muted whitespace-nowrap"
                      style={{ width: colWidths[1] }}
                    >
                      {formatTimestamp(alert.timestamp)}
                    </td>
                    <td className="px-4 py-3" style={{ width: colWidths[2] }}>
                      <SeverityBadge severity={alert.severity} />
                    </td>
                    <td
                      className="px-4 py-3 text-muted max-w-xs truncate"
                      style={{ width: colWidths[3] }}
                    >
                      {alert.signature}
                    </td>
                    <td
                      className="px-4 py-3 font-mono text-xs text-subtle whitespace-nowrap"
                      style={{ width: colWidths[4] }}
                    >
                      {alert.src_ip}
                      {alert.src_port != null ? `:${alert.src_port}` : ""}
                    </td>
                    <td
                      className="px-4 py-3 font-mono text-xs text-subtle whitespace-nowrap"
                      style={{ width: colWidths[5] }}
                    >
                      {alert.dest_ip}
                      {alert.dest_port != null ? `:${alert.dest_port}` : ""}
                    </td>
                    <td className="px-4 py-3" style={{ width: colWidths[6] }}>
                      <span
                        className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${protocolColor(alert.proto)}`}
                      >
                        {alert.proto ?? "--"}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3"
                      style={{ width: colWidths[7] }}
                    >
                      <span
                        className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                          alert.action === "blocked"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-green-500/20 text-green-400"
                        }`}
                      >
                        {alert.action}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ width: colWidths[8] }}>
                      <button
                        onClick={(e) => handleExplain(e, alert)}
                        className="px-3 py-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-md transition-colors"
                        title="Explain this alert"
                      >
                        Explain
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-subtle">
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
        <div className="flex items-center justify-between rounded-lg border border-app surface-2 px-4 py-3">
          <p className="text-xs text-muted">
            Showing page {data.page} of {data.pages} ({data.total} total alerts)
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
              ),
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

      {/* Explanation Modal */}
      {selectedAlert && (
        <ExplanationModal
          alert={selectedAlert}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedAlert(null);
          }}
        />
      )}
    </div>
  );
}

function generatePageNumbers(
  current: number,
  total: number,
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
