"use client";

import Link from "next/link";
import type { AlertRecord } from "@/lib/types";
import { formatTimestamp } from "@/lib/utils";
import SeverityBadge from "@/components/alerts/SeverityBadge";

interface RecentAlertsProps {
  alerts: AlertRecord[];
}

export default function RecentAlerts({ alerts }: RecentAlertsProps) {
  const recent = alerts.slice(0, 10);

  return (
    <div className="rounded-lg border border-app surface-2">
      <div className="flex items-center justify-between border-b border-app px-5 py-3">
        <h2 className="text-sm font-semibold text-strong">Recent Alerts</h2>
        <Link
          href="/alerts"
          className="text-xs text-muted hover:text-strong transition-colors"
        >
          View all &rarr;
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="surface-3 text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Time</th>
              <th className="px-4 py-2.5 text-left font-medium">Severity</th>
              <th className="px-4 py-2.5 text-left font-medium">Signature</th>
              <th className="px-4 py-2.5 text-left font-medium">Source &rarr; Dest</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--border)]">
            {recent.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-subtle text-sm"
                >
                  No alerts yet
                </td>
              </tr>
            ) : (
              recent.map((alert) => (
                <tr
                  key={alert.id}
                  className="hover-surface-3 transition-colors"
                >
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/alerts/${alert.id}`}
                      className="font-mono text-xs text-muted hover:text-strong"
                    >
                      {formatTimestamp(alert.timestamp)}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <SeverityBadge severity={alert.severity} />
                  </td>
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/alerts/${alert.id}`}
                      className="text-muted hover:text-strong max-w-xs truncate block"
                    >
                      {alert.signature}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-subtle">
                    <Link href={`/alerts/${alert.id}`} className="hover:text-strong">
                      {alert.src_ip}
                      {alert.src_port != null ? `:${alert.src_port}` : ""}
                      {" \u2192 "}
                      {alert.dest_ip}
                      {alert.dest_port != null ? `:${alert.dest_port}` : ""}
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
