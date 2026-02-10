"use client";

import Header from "@/components/layout/Header";
import { useWebSocket } from "@/hooks/useWebSocket";
import useSWR from "swr";
import { fetchStatus, fetchHealth } from "@/lib/api";
import type { SystemStatus } from "@/lib/types";

export default function StatusPage() {
  const { status: wsStatus } = useWebSocket();
  const { data: sysStatus } = useSWR<SystemStatus>("status", fetchStatus, {
    refreshInterval: 5000,
  });
  const { data: health } = useSWR("health", fetchHealth, {
    refreshInterval: 5000,
  });

  return (
    <div className="min-h-screen">
      <Header title="System Status" wsStatus={wsStatus} />
      <div className="p-6 space-y-6">
        {/* Backend Health */}
        <div className="surface-2 border border-app rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Backend</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-muted">Status</div>
            <div>
              {health ? (
                <span className="text-green-400">Online</span>
              ) : (
                <span className="text-red-400">Offline</span>
              )}
            </div>
            <div className="text-muted">Version</div>
            <div className="font-mono">{health?.version || "--"}</div>
          </div>
        </div>

        {/* Watcher Status */}
        <div className="surface-2 border border-app rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">EVE Watcher</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-muted">Running</div>
            <div>
              {sysStatus?.watcher.running ? (
                <span className="text-green-400">Yes</span>
              ) : (
                <span className="text-red-400">No</span>
              )}
            </div>
            <div className="text-muted">EVE Path</div>
            <div className="font-mono text-xs">
              {sysStatus?.watcher.eve_path || "--"}
            </div>
            <div className="text-muted">Lines Processed</div>
            <div className="font-mono">
              {sysStatus?.watcher.lines_processed?.toLocaleString() || "0"}
            </div>
            <div className="text-muted">Last Event</div>
            <div className="font-mono text-xs">
              {sysStatus?.watcher.last_event_at || "--"}
            </div>
          </div>
        </div>

        {/* WebSocket */}
        <div className="surface-2 border border-app rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">WebSocket</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-muted">Connection</div>
            <div>
              {wsStatus === "connected" && (
                <span className="text-green-400">Connected</span>
              )}
              {wsStatus === "connecting" && (
                <span className="text-yellow-400">Connecting...</span>
              )}
              {wsStatus === "disconnected" && (
                <span className="text-red-400">Disconnected</span>
              )}
            </div>
          </div>
        </div>

        {/* Database */}
        <div className="surface-2 border border-app rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Database</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-muted">Status</div>
            <div>
              <span className="text-green-400">
                {sysStatus?.database.status || "--"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
