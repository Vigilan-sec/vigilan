"use client";

import Header from "@/components/layout/Header";
import FlowsTable from "@/components/flows/FlowsTable";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function FlowsPage() {
  const { status } = useWebSocket();

  return (
    <div className="min-h-screen">
      <Header title="Network Flows" wsStatus={status} />
      <div className="p-6">
        <FlowsTable />
      </div>
    </div>
  );
}
