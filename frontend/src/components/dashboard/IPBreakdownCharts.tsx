import IPBreakdownChart from "./IPBreakdownChart";
import type { IPChartsResponse } from "@/lib/types";

interface IPBreakdownChartsProps {
  charts: IPChartsResponse | undefined;
}

export default function IPBreakdownCharts({ charts }: IPBreakdownChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <IPBreakdownChart
        title="Top Source IPs by App Protocol"
        chart={charts?.by_app_proto}
      />
      <IPBreakdownChart
        title="Top Source IPs by Alert Category"
        chart={charts?.by_category}
      />
      <IPBreakdownChart
        title="Top Source IPs by Event Type"
        chart={charts?.by_event_type}
      />
      <IPBreakdownChart
        title="Top Source IPs by Action"
        chart={charts?.by_action}
      />
    </div>
  );
}
