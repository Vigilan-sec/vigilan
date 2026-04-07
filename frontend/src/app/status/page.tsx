"use client";

import Header from "@/components/layout/Header";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useTranslation } from "@/hooks/useTranslation";
import useSWR from "swr";
import { fetchStatus, fetchHealth } from "@/lib/api";
import type { SystemStatus } from "@/lib/types";
import { useAuth } from "@/components/auth/AuthProvider";

export default function StatusPage() {
  const { status: wsStatus } = useWebSocket();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { data: sysStatus } = useSWR<SystemStatus>("status", fetchStatus, {
    refreshInterval: 5000,
  });
  const { data: health } = useSWR("health", fetchHealth, {
    refreshInterval: 5000,
  });

  return (
    <div className="min-h-screen">
      <Header title={t("status.title")} wsStatus={wsStatus} />
      <div className="p-6 space-y-6">
        {/* Backend Health */}
        <div className="surface-2 border border-app rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">{t("status.backend")}</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-muted">{t("status.backendStatus")}</div>
            <div>
              {health ? (
                <span className="text-green-400">{t("status.online")}</span>
              ) : (
                <span className="text-red-400">{t("status.offline")}</span>
              )}
            </div>
            <div className="text-muted">{t("status.backendVersion")}</div>
            <div className="font-mono">{health?.version || "--"}</div>
          </div>
        </div>

        {/* Watcher Status */}
        <div className="surface-2 border border-app rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">{t("status.watcher")}</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-muted">{t("status.watcherRunning")}</div>
            <div>
              {sysStatus?.watcher.running ? (
                <span className="text-green-400">{t("status.yes")}</span>
              ) : (
                <span className="text-red-400">{t("status.no")}</span>
              )}
            </div>
            <div className="text-muted">{t("status.watcherLinesProcessed")}</div>
            <div className="font-mono">
              {sysStatus?.watcher.lines_processed?.toLocaleString() || "0"}
            </div>
            <div className="text-muted">{t("status.watcherLastEvent")}</div>
            <div className="font-mono text-xs">
              {sysStatus?.watcher.last_event_at || "--"}
            </div>
          </div>
        </div>

        {/* WebSocket */}
        <div className="surface-2 border border-app rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">{t("status.websocket")}</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-muted">{t("status.wsConnection")}</div>
            <div>
              {wsStatus === "connected" && (
                <span className="text-green-400">{t("status.wsConnected")}</span>
              )}
              {wsStatus === "connecting" && (
                <span className="text-yellow-400">{t("status.wsConnecting")}</span>
              )}
              {wsStatus === "disconnected" && (
                <span className="text-red-400">{t("status.wsDisconnected")}</span>
              )}
            </div>
          </div>
        </div>

        {/* Database */}
        <div className="surface-2 border border-app rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">{t("status.database")}</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-muted">{t("status.dbStatus")}</div>
            <div>
              <span className="text-green-400">
                {sysStatus?.database.status || "--"}
              </span>
            </div>
          </div>
        </div>

        <div className="surface-2 border border-app rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">{t("status.auth")}</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-muted">{t("status.authUser")}</div>
            <div className="font-mono">{user?.username || "--"}</div>
            <div className="text-muted">{t("status.authSecureCookie")}</div>
            <div>
              {sysStatus?.auth.secure_cookie ? (
                <span className="text-green-400">{t("status.enabled")}</span>
              ) : (
                <span className="text-red-400">{t("status.disabled")}</span>
              )}
            </div>
            <div className="text-muted">{t("status.authSessionTtl")}</div>
            <div className="font-mono">
              {sysStatus?.auth.session_ttl_hours || "--"}h
            </div>
            <div className="text-muted">{t("status.authUserCount")}</div>
            <div className="font-mono">{sysStatus?.auth.user_count || "--"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
