"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import Header from "@/components/layout/Header";
import AlertDetail from "@/components/alerts/AlertDetail";
import { useWebSocket } from "@/hooks/useWebSocket";
import { fetchAlert } from "@/lib/api";
import type { AlertRecord } from "@/lib/types";
import Link from "next/link";

export default function AlertDetailPage() {
  const params = useParams();
  const alertId = Number(params.id);
  const { status } = useWebSocket();

  const { data: alert, error, isLoading } = useSWR<AlertRecord>(
    alertId ? `alert-${alertId}` : null,
    () => fetchAlert(alertId)
  );

  return (
    <div className="min-h-screen">
      <Header title={`Alert #${alertId}`} wsStatus={status} />
      <div className="p-6">
        <Link
          href="/alerts"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-strong mb-4"
        >
          &larr; Back to Alerts
        </Link>

        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[color:var(--accent)]" />
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
            Failed to load alert: {error.message}
          </div>
        )}

        {alert && <AlertDetail alert={alert} />}
      </div>
    </div>
  );
}
