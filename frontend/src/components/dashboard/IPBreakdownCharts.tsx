"use client";

import IPBreakdownChart from "./IPBreakdownChart";
import type { IPChartsResponse } from "@/lib/types";
import { useTranslation } from "@/hooks/useTranslation";

interface IPBreakdownChartsProps {
  charts: IPChartsResponse | undefined;
}

export default function IPBreakdownCharts({ charts }: IPBreakdownChartsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <IPBreakdownChart
        title={t("ipBreakdown.byAppProto")}
        chart={charts?.by_app_proto}
      />
      <IPBreakdownChart
        title={t("ipBreakdown.byDestPort")}
        chart={charts?.by_category}
      />
      <IPBreakdownChart
        title={t("ipBreakdown.bySeverity")}
        chart={charts?.by_event_type}
      />
      <IPBreakdownChart
        title="Top Source IPs by Action"
        chart={charts?.by_action}
      />
    </div>
  );
}
