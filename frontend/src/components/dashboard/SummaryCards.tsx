"use client";

import { formatNumber } from "@/lib/utils";
import type { AlertStats, FlowStats } from "@/lib/types";
import { useTranslation } from "@/hooks/useTranslation";

interface SummaryCardsProps {
  alertStats: AlertStats | undefined;
  flowStats: FlowStats | undefined;
}

export default function SummaryCards({ alertStats, flowStats }: SummaryCardsProps) {
  const { t } = useTranslation();

  const cards = [
    {
      label: t("dashboard.totalAlerts"),
      value: alertStats ? formatNumber(alertStats.total) : "--",
      color: "text-strong",
      subtext: t("common.allTime"),
    },
    {
      label: t("dashboard.highSeverity"),
      value: alertStats ? formatNumber(alertStats.by_severity["1"] ?? 0) : "--",
      color: "text-red-400",
      subtext: t("dashboard.severity1"),
    },
    {
      label: t("dashboard.mediumSeverity"),
      value: alertStats ? formatNumber(alertStats.by_severity["2"] ?? 0) : "--",
      color: "text-yellow-400",
      subtext: t("dashboard.severity2"),
    },
    {
      label: t("dashboard.activeFlows"),
      value: flowStats ? formatNumber(flowStats.total) : "--",
      color: "text-blue-400",
      subtext: flowStats
        ? t("dashboard.bytesTotal", { bytes: formatNumber(flowStats.total_bytes) })
        : undefined,
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
