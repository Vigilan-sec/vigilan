"use client";

import type { SecurityOverview } from "@/lib/types";
import { formatNumber, formatTimestamp } from "@/lib/utils";

interface RecentSecurityHitsProps {
  overview: SecurityOverview | undefined;
}

export default function RecentSecurityHits({
  overview,
}: RecentSecurityHitsProps) {
  return (
    <div className="rounded-lg border border-app surface-2 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-strong">Recent scenario hits</h2>
          <p className="mt-1 text-xs text-subtle">
            Latest alerts from the tracked attack playbooks.
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <div className="overflow-x-auto rounded-lg border border-app">
          <table className="w-full text-sm">
            <thead className="surface-3 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Time</th>
                <th className="px-4 py-2.5 text-left font-medium">Signature</th>
                <th className="px-4 py-2.5 text-left font-medium">Path</th>
                <th className="px-4 py-2.5 text-left font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--border)]">
              {!overview || overview.recent_hits.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-subtle">
                    No tracked scenario hits yet.
                  </td>
                </tr>
              ) : (
                overview.recent_hits.map((hit) => (
                  <tr key={hit.id} className="hover-surface-3 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-xs text-muted">
                      {formatTimestamp(hit.timestamp)}
                    </td>
                    <td className="px-4 py-2.5 text-muted">{hit.signature}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-subtle">
                      {hit.src_ip} → {hit.dest_ip}
                      {hit.dest_port != null ? `:${hit.dest_port}` : ""}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex rounded border px-2 py-0.5 text-xs font-medium ${
                          hit.action === "blocked"
                            ? "status-badge-danger"
                            : "status-badge-success"
                        }`}
                      >
                        {hit.action}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-app surface-1 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
              Tactic focus
            </h3>
            <div className="mt-3 space-y-3">
              {overview?.tactic_breakdown.length ? (
                overview.tactic_breakdown.map((item) => (
                  <div key={item.tactic}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted">{item.tactic}</span>
                      <span className="font-mono text-subtle">
                        {formatNumber(item.count)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full surface-3">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-500/70 to-blue-500/70"
                        style={{
                          width: `${Math.min(
                            100,
                            item.count * 10,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-subtle">No tactic data yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-app surface-1 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
              Top attack sources
            </h3>
            <div className="mt-3 space-y-2">
              {overview?.top_sources.length ? (
                overview.top_sources.map((source) => (
                  <div
                    key={source.ip}
                    className="flex items-center justify-between rounded-md surface-3 px-3 py-2"
                  >
                    <span className="font-mono text-xs text-muted">{source.ip}</span>
                    <span className="text-xs text-subtle">
                      {formatNumber(source.count)} hits
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-subtle">No source data yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
