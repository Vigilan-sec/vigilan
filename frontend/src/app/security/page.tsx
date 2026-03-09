"use client";

import useSWR from "swr";
import Header from "@/components/layout/Header";
import ScenarioGrid from "@/components/security/ScenarioGrid";
import RecentSecurityHits from "@/components/security/RecentSecurityHits";
import { useWebSocket } from "@/hooks/useWebSocket";
import { fetchSecurityOverview } from "@/lib/api";
import type { SecurityOverview } from "@/lib/types";

export default function SecurityPage() {
  const { status } = useWebSocket();
  const { data } = useSWR<SecurityOverview>(
    "security-overview",
    fetchSecurityOverview,
    { refreshInterval: 10000 },
  );

  return (
    <div className="min-h-screen">
      <Header title="Security Scenarios" wsStatus={status} />
      <div className="space-y-6 p-6">
        <ScenarioGrid scenarios={data?.scenarios || []} />
        <RecentSecurityHits overview={data} />
      </div>
    </div>
  );
}
