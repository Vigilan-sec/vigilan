"use client";

import Header from "@/components/layout/Header";
import FlowsTable from "@/components/flows/FlowsTable";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useTranslation } from "@/hooks/useTranslation";

export default function FlowsPage() {
  const { status } = useWebSocket();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen">
      <Header title={t("flows.title")} wsStatus={status} />
      <div className="p-6">
        <FlowsTable />
      </div>
    </div>
  );
}
