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
    <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/50">
      <div className="flex items-center justify-between border-b border-zinc-700/50 px-5 py-3">
        <h2 className="text-sm font-semibold text-zinc-100">Recent Alerts</h2>
        <Link
          href="/alerts"
          className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          View all &rarr;
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-zinc-800 text-xs uppercase text-zinc-400">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Time</th>
              <th className="px-4 py-2.5 text-left font-medium">Severity</th>
              <th className="px-4 py-2.5 text-left font-medium">Signature</th>
              <th className="px-4 py-2.5 text-left font-medium">Source &rarr; Dest</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-700/30">
            {recent.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-zinc-500 text-sm"
                >
                  No alerts yet
                </td>
              </tr>
            ) : (
              recent.map((alert) => (
                <tr
                  key={alert.id}
                  className="hover:bg-zinc-700/40 transition-colors"
                >
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/alerts/${alert.id}`}
                      className="font-mono text-xs text-zinc-300 hover:text-zinc-100"
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
                      className="text-zinc-300 hover:text-zinc-100 max-w-xs truncate block"
                    >
                      {alert.signature}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-zinc-400">
                    <Link href={`/alerts/${alert.id}`} className="hover:text-zinc-200">
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
