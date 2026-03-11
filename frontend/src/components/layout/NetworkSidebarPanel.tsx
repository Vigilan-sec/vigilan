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
          <h2 className="text-sm font-semibold text-subtle">
            Network
          </h2>
          <p className="mt-1 text-[11px] text-muted">
            {data
              ? `${data.summary.active_devices} active machine${data.summary.active_devices === 1 ? "" : "s"}`
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
    </div>
  );
}
