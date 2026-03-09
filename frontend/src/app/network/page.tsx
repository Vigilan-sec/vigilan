"use client";

import useSWR from "swr";
import Header from "@/components/layout/Header";
import { useWebSocket } from "@/hooks/useWebSocket";
import { fetchNetworkOverview } from "@/lib/api";
import type { NetworkOverview } from "@/lib/types";
import { formatBytes, formatTimestamp } from "@/lib/utils";

export default function NetworkPage() {
  const { status } = useWebSocket();
  const { data } = useSWR<NetworkOverview>("network-overview", fetchNetworkOverview, {
    refreshInterval: 15000,
  });

  return (
    <div className="min-h-screen">
      <Header title="Network Inventory" wsStatus={status} />
      <div className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-app surface-2 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Devices</p>
            <p className="mt-2 text-2xl font-bold text-strong">
              {data?.summary.total_devices ?? "--"}
            </p>
          </div>
          <div className="rounded-lg border border-app surface-2 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Active now</p>
            <p className="mt-2 text-2xl font-bold text-emerald-300">
              {data?.summary.active_devices ?? "--"}
            </p>
          </div>
          <div className="rounded-lg border border-app surface-2 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Known lab assets</p>
            <p className="mt-2 text-2xl font-bold text-blue-300">
              {data?.summary.known_devices ?? "--"}
            </p>
          </div>
          <div className="rounded-lg border border-app surface-2 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Last observed</p>
            <p className="mt-2 text-sm font-mono text-subtle">
              {data?.summary.last_observed_at
                ? formatTimestamp(data.summary.last_observed_at)
                : "--"}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-app surface-2 p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-strong">Observed devices</h2>
            <p className="mt-1 text-xs text-subtle">
              Inventory built from known lab hosts plus IPs observed in flows and alerts.
            </p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-app">
            <table className="w-full text-sm">
              <thead className="surface-3 text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">Device</th>
                  <th className="px-4 py-2.5 text-left font-medium">IP</th>
                  <th className="px-4 py-2.5 text-left font-medium">Role</th>
                  <th className="px-4 py-2.5 text-left font-medium">Status</th>
                  <th className="px-4 py-2.5 text-left font-medium">Flows</th>
                  <th className="px-4 py-2.5 text-left font-medium">Alerts</th>
                  <th className="px-4 py-2.5 text-left font-medium">Traffic</th>
                  <th className="px-4 py-2.5 text-left font-medium">Protocols</th>
                  <th className="px-4 py-2.5 text-left font-medium">Last seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--border)]">
                {(data?.devices || []).map((device) => (
                  <tr key={device.ip} className="hover-surface-3 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-strong">{device.label}</p>
                        <p className="mt-1 text-xs text-subtle">{device.details}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-subtle">{device.ip}</td>
                    <td className="px-4 py-3 text-muted">
                      {device.role} • {device.segment}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          device.status === "active"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : device.status === "idle"
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-slate-500/20 text-slate-300"
                        }`}
                      >
                        {device.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-subtle">{device.total_flows}</td>
                    <td className="px-4 py-3 font-mono text-xs text-subtle">{device.total_alerts}</td>
                    <td className="px-4 py-3 font-mono text-xs text-subtle">
                      {formatBytes(device.total_bytes)}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {device.top_protocols.length ? device.top_protocols.join(", ") : "--"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-subtle">
                      {device.last_seen ? formatTimestamp(device.last_seen) : "--"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
