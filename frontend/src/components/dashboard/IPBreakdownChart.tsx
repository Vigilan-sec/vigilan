"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { IPBreakdownChart as ChartData } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

/** Catppuccin Mocha accent palette — high contrast on dark backgrounds. */
const CHART_COLORS = [
  "#89b4fa", // Blue
  "#a6e3a1", // Green
  "#fab387", // Peach
  "#cba6f7", // Mauve
  "#94e2d5", // Teal
  "#f38ba8", // Red
  "#f9e2af", // Yellow
  "#74c7ec", // Sapphire
  "#f5c2e7", // Pink
  "#b4befe", // Lavender
  "#89dceb", // Sky
  "#eba0ac", // Maroon
  "#f2cdcd", // Flamingo
  "#f5e0dc", // Rosewater
];

interface IPBreakdownChartProps {
  title: string;
  chart: ChartData | undefined;
}

export default function IPBreakdownChart({
  title,
  chart,
}: IPBreakdownChartProps) {
  if (!chart || chart.data.length === 0) {
    return (
      <div className="rounded-lg border border-app surface-2 p-5">
        <h2 className="text-sm font-semibold text-strong mb-4">{title}</h2>
        <p className="text-sm text-subtle">No data available</p>
      </div>
    );
  }

  const chartHeight = Math.max(200, chart.data.length * 40);

  return (
    <div className="rounded-lg border border-app surface-2 p-5">
      <h2 className="text-sm font-semibold text-strong mb-4">{title}</h2>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={chart.data}
          layout="vertical"
          margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
        >
          <XAxis
            type="number"
            tick={{ fill: "var(--text-subtle)", fontSize: 11 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
            tickFormatter={(v: number) => formatNumber(v)}
          />
          <YAxis
            type="category"
            dataKey="ip"
            width={120}
            tick={{
              fill: "var(--text-muted)",
              fontSize: 11,
              fontFamily: "var(--font-mono)",
            }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--surface-1)",
              border: "1px solid var(--border)",
              borderRadius: "0.5rem",
              color: "var(--text-strong)",
              fontSize: "0.75rem",
            }}
            formatter={(value?: number) => formatNumber(value ?? 0)}
            cursor={{ fill: "var(--surface-3)", opacity: 0.3 }}
          />
          <Legend
            wrapperStyle={{ fontSize: "0.7rem", color: "var(--text-muted)" }}
          />
          {chart.keys.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              stackId="stack"
              fill={CHART_COLORS[i % CHART_COLORS.length]}
              radius={
                i === chart.keys.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]
              }
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
