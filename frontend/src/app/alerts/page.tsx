"use client";

import Header from "@/components/layout/Header";
import AlertsTable from "@/components/alerts/AlertsTable";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useTranslation } from "@/hooks/useTranslation";

export default function AlertsPage() {
  const { status } = useWebSocket();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen">
      <Header title={t("alerts.title")} wsStatus={status} />
      <div className="p-6">
        <AlertsTable />
      </div>
    </div>
  );
}
