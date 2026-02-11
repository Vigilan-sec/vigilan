"use client";

import Header from "@/components/layout/Header";
import SummaryCards from "@/components/dashboard/SummaryCards";
import RecentAlerts from "@/components/dashboard/RecentAlerts";
import TopSignatures from "@/components/dashboard/TopSignatures";
import IPBreakdownCharts from "@/components/dashboard/IPBreakdownCharts";
import { useWebSocket } from "@/hooks/useWebSocket";
import useSWR from "swr";
import { fetchAlertStats, fetchFlowStats, fetchIPCharts } from "@/lib/api";
import type { AlertStats, FlowStats, IPChartsResponse } from "@/lib/types";

export default function DashboardPage() {
  const { alerts, status } = useWebSocket();
  const { data: alertStats } = useSWR<AlertStats>("alert-stats", () => fetchAlertStats() as Promise<AlertStats>, {
    refreshInterval: 10000,
    fallbackData: undefined,
  });
  const { data: flowStats } = useSWR<FlowStats>("flow-stats", () => fetchFlowStats() as Promise<FlowStats>, {
    refreshInterval: 10000,
    fallbackData: undefined,
  });
  const { data: ipCharts } = useSWR<IPChartsResponse>(
    "ip-charts",
    () => fetchIPCharts() as Promise<IPChartsResponse>,
    { refreshInterval: 10000, fallbackData: undefined },
  );

  return (
    <div className="min-h-screen">
      <Header title="Dashboard" wsStatus={status} />
      <div className="p-6 space-y-6">
        <SummaryCards alertStats={alertStats} flowStats={flowStats} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopSignatures topSignatures={alertStats?.top_signatures || []} />
          <RecentAlerts alerts={alerts} />
        </div>
        <IPBreakdownCharts charts={ipCharts} />
      </div>
    </div>
  );
}
