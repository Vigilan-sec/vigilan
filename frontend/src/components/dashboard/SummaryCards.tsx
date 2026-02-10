import { formatNumber } from "@/lib/utils";
import type { AlertStats, FlowStats } from "@/lib/types";

interface SummaryCardsProps {
  alertStats: AlertStats | undefined;
  flowStats: FlowStats | undefined;
}

interface CardData {
  label: string;
  value: string;
  color: string;
  subtext?: string;
}

export default function SummaryCards({ alertStats, flowStats }: SummaryCardsProps) {
  const cards: CardData[] = [
    {
      label: "Total Alerts",
      value: alertStats ? formatNumber(alertStats.total) : "--",
      color: "text-strong",
      subtext: "All time",
    },
    {
      label: "High Severity",
      value: alertStats ? formatNumber(alertStats.by_severity["1"] ?? 0) : "--",
      color: "text-red-400",
      subtext: "Severity 1",
    },
    {
      label: "Medium Severity",
      value: alertStats ? formatNumber(alertStats.by_severity["2"] ?? 0) : "--",
      color: "text-yellow-400",
      subtext: "Severity 2",
    },
    {
      label: "Active Flows",
      value: flowStats ? formatNumber(flowStats.total) : "--",
      color: "text-blue-400",
      subtext: flowStats ? `${formatNumber(flowStats.total_bytes)} bytes total` : undefined,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg border border-app surface-2 p-5"
        >
          <p className="text-xs font-medium text-muted uppercase tracking-wider">
            {card.label}
          </p>
          <p className={`mt-2 text-2xl font-bold font-mono ${card.color}`}>
            {card.value}
          </p>
          {card.subtext && (
            <p className="mt-1 text-xs text-subtle">{card.subtext}</p>
          )}
        </div>
      ))}
    </div>
  );
}
