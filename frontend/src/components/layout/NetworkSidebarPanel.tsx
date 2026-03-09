"use client";

import Link from "next/link";
import useSWR from "swr";
import { fetchNetworkOverview } from "@/lib/api";
import type { NetworkOverview } from "@/lib/types";

interface NetworkSidebarPanelProps {
  collapsed: boolean;
}

export default function NetworkSidebarPanel({
  collapsed,
}: NetworkSidebarPanelProps) {
  const { data } = useSWR<NetworkOverview>(
    collapsed ? null : "network-overview",
    fetchNetworkOverview,
    { refreshInterval: 15000 },
  );

  if (collapsed) {
    return null;
  }

  return (
    <div className="mx-3 mb-4 rounded-xl border border-app surface-1 p-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
            Network
          </h2>
          <p className="mt-1 text-[11px] text-muted">
            {data
              ? `${data.summary.active_devices}/${data.summary.total_devices} active`
              : "Loading devices..."}
          </p>
        </div>
        <Link
          href="/network"
          className="text-[11px] text-muted transition-colors hover:text-strong"
        >
          Open
        </Link>
      </div>

      <div className="mt-3 space-y-2">
        {(data?.devices || []).slice(0, 4).map((device) => (
          <div
            key={device.ip}
            className="rounded-lg border border-app surface-2 px-3 py-2"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-strong">
                {device.label}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                  device.status === "active"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : device.status === "idle"
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-slate-500/20 text-slate-300"
                }`}
              >
                {device.status}
              </span>
            </div>
            <p className="mt-1 font-mono text-[11px] text-subtle">{device.ip}</p>
            <p className="mt-1 text-[11px] text-muted">
              {device.role} • {device.segment}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
