"use client";

import Header from "@/components/layout/Header";
import AlertsTable from "@/components/alerts/AlertsTable";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function AlertsPage() {
  const { status } = useWebSocket();

  return (
    <div className="min-h-screen">
      <Header title="Alerts" wsStatus={status} />
      <div className="p-6">
        <AlertsTable />
      </div>
    </div>
  );
}
