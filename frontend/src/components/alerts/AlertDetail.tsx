"use client";

import { useState } from "react";
import type { AlertRecord } from "@/lib/types";
import { formatFullDate, protocolColor } from "@/lib/utils";
import SeverityBadge from "@/components/alerts/SeverityBadge";
import ExplanationModal from "@/components/alerts/ExplanationModal";

interface AlertDetailProps {
  alert: AlertRecord;
}

interface FieldDef {
  label: string;
  value: string | number | null | undefined;
  mono?: boolean;
  render?: () => React.ReactNode;
}

export default function AlertDetail({ alert }: AlertDetailProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fields: FieldDef[] = [
    { label: "Alert ID", value: alert.id, mono: true },
    { label: "Timestamp", value: formatFullDate(alert.timestamp), mono: true },
    {
      label: "Severity",
      value: null,
      render: () => <SeverityBadge severity={alert.severity} />,
    },
    { label: "Signature", value: alert.signature },
    { label: "Signature ID", value: alert.signature_id, mono: true },
    { label: "Category", value: alert.category },
    { label: "Action", value: alert.action },
    { label: "Source IP", value: alert.src_ip, mono: true },
    {
      label: "Source Port",
      value: alert.src_port != null ? String(alert.src_port) : "--",
      mono: true,
    },
    { label: "Destination IP", value: alert.dest_ip, mono: true },
    {
      label: "Destination Port",
      value: alert.dest_port != null ? String(alert.dest_port) : "--",
      mono: true,
    },
    {
      label: "Protocol",
      value: null,
      render: () => (
        <span
          className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${protocolColor(alert.proto)}`}
        >
          {alert.proto ?? "--"}
        </span>
      ),
    },
    { label: "App Protocol", value: alert.app_proto ?? "--" },
    {
      label: "Flow ID",
      value: alert.flow_id != null ? String(alert.flow_id) : "--",
      mono: true,
    },
    { label: "Community ID", value: alert.community_id ?? "--", mono: true },
    { label: "Interface", value: alert.in_iface ?? "--" },
    { label: "GID", value: alert.gid, mono: true },
    { label: "Rev", value: alert.rev, mono: true },
    {
      label: "Ingested At",
      value: formatFullDate(alert.ingested_at),
      mono: true,
    },
  ];

  let parsedMetadata: string | null = null;
  if (alert.metadata_json) {
    try {
      parsedMetadata = JSON.stringify(JSON.parse(alert.metadata_json), null, 2);
    } catch {
      parsedMetadata = alert.metadata_json;
    }
  }

  return (
    <div className="space-y-6">
      {/* Explain Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 text-sm font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Explain Alert & Get Recommendations
        </button>
      </div>

      {/* Detail Fields */}
      <div className="rounded-lg border border-app surface-2 overflow-hidden">
        <div className="border-b border-app px-5 py-3">
          <h2 className="text-sm font-semibold text-strong">Alert Details</h2>
        </div>
        <dl className="divide-y divide-[color:var(--border)]">
          {fields.map((field) => (
            <div
              key={field.label}
              className="flex items-baseline px-5 py-3 gap-4"
            >
              <dt className="w-40 shrink-0 text-xs font-medium text-muted uppercase tracking-wider">
                {field.label}
              </dt>
              <dd
                className={`text-sm text-muted ${
                  field.mono ? "font-mono" : ""
                }`}
              >
                {field.render ? field.render() : (field.value ?? "--")}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Metadata JSON */}
      {parsedMetadata && (
        <div className="rounded-lg border border-app surface-2 overflow-hidden">
          <div className="border-b border-app px-5 py-3">
            <h2 className="text-sm font-semibold text-strong">Metadata</h2>
          </div>
          <pre className="overflow-x-auto p-5 text-xs font-mono text-muted leading-relaxed">
            {parsedMetadata}
          </pre>
        </div>
      )}

      {/* Raw JSON */}
      <div className="rounded-lg border border-app surface-2 overflow-hidden">
        <div className="border-b border-app px-5 py-3">
          <h2 className="text-sm font-semibold text-strong">Raw Record</h2>
        </div>
        <pre className="overflow-x-auto p-5 text-xs font-mono text-subtle leading-relaxed">
          {JSON.stringify(alert, null, 2)}
        </pre>
      </div>

      {/* Explanation Modal */}
      <ExplanationModal
        alert={alert}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
