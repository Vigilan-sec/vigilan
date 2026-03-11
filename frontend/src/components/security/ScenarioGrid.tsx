"use client";

import Link from "next/link";
import type { SecurityScenario } from "@/lib/types";
import { formatNumber, formatTimestamp } from "@/lib/utils";

function severityClasses(severity: string): string {
  switch (severity) {
    case "high":
      return "border-red-500/30 bg-red-500/10";
    case "medium":
      return "border-amber-500/30 bg-amber-500/10";
    default:
      return "border-sky-500/30 bg-sky-500/10";
  }
}

interface ScenarioGridProps {
  scenarios: SecurityScenario[];
  compact?: boolean;
}

export default function ScenarioGrid({
  scenarios,
  compact = false,
}: ScenarioGridProps) {
  const items = compact ? scenarios.slice(0, 4) : scenarios;

  return (
    <div className="rounded-lg border border-app surface-2 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-strong">
            {compact ? "Threat campaigns" : "Scenario coverage"}
          </h2>
          <p className="mt-1 text-xs text-subtle">
            Local attack detections mapped to MITRE-style tactics.
          </p>
        </div>
        {compact && (
          <Link
            href="/security"
            className="text-xs text-muted transition-colors hover:text-strong"
          >
            Open security &rarr;
          </Link>
        )}
      </div>

      <div className={`grid gap-4 ${compact ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"}`}>
        {items.map((scenario) => (
          <div
            key={scenario.key}
            className={`rounded-xl border p-4 ${severityClasses(scenario.severity)}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted">
                  {scenario.tactic}
                </p>
                <h3 className="mt-2 text-sm font-semibold text-strong">
                  {scenario.title}
                </h3>
              </div>
              <span className="rounded-full border border-app px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
                {scenario.technique}
              </span>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted">
              {scenario.description}
            </p>
            <div className="mt-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-subtle">
                  Alerts
                </p>
                <p className="mt-1 font-mono text-2xl font-bold text-strong">
                  {formatNumber(scenario.total_alerts)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wide text-subtle">
                  Last seen
                </p>
                <p className="mt-1 text-xs text-muted">
                  {scenario.last_seen ? formatTimestamp(scenario.last_seen) : "Quiet"}
                </p>
              </div>
            </div>
            {scenario.last_signature && (
              <p className="mt-3 truncate text-[11px] text-subtle">
                Latest: {scenario.last_signature}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
