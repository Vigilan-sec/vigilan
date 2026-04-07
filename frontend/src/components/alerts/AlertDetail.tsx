"use client";

import { useState } from "react";
import type { AlertRecord } from "@/lib/types";
import { formatFullDate, protocolColor } from "@/lib/utils";
import SeverityBadge from "@/components/alerts/SeverityBadge";
import ExplanationModal from "@/components/alerts/ExplanationModal";
import { useTranslation } from "@/hooks/useTranslation";

interface AlertDetailProps {
  alert: AlertRecord;
}

interface FieldDef {
  label: string;
  value: string | number | null | undefined;
  mono?: boolean;
  render?: () => React.ReactNode;
}

function parseJsonField(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function FieldList({ fields }: { fields: FieldDef[] }) {
  return (
    <dl className="divide-y divide-[color:var(--border)]">
      {fields.map((field) => (
        <div key={field.label} className="flex items-baseline px-5 py-3 gap-4">
          <dt className="w-44 shrink-0 text-xs font-medium text-muted uppercase tracking-wider">
            {field.label}
          </dt>
          <dd className={`text-sm text-muted ${field.mono ? "font-mono" : ""}`}>
            {field.render ? field.render() : (field.value ?? "--")}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default function AlertDetail({ alert }: AlertDetailProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTechnical, setShowTechnical] = useState(false);
  const { t } = useTranslation();

  const summaryFields: FieldDef[] = [
    { label: t("alertDetail.fieldId"), value: alert.id, mono: true },
    { label: t("alertDetail.fieldTimestamp"), value: formatFullDate(alert.timestamp), mono: true },
    {
      label: t("alertDetail.fieldSeverity"),
      value: null,
      render: () => <SeverityBadge severity={alert.severity} />,
    },
    { label: t("alertDetail.fieldSignature"), value: alert.signature },
    { label: t("alertDetail.fieldCategory"), value: alert.category },
    {
      label: t("alertDetail.fieldAction"),
      value: null,
      render: () => (
        <span
          className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
            alert.action === "blocked"
              ? "bg-red-500/20 text-red-400"
              : "bg-green-500/20 text-green-400"
          }`}
        >
          {alert.action === "blocked" ? t("action.blocked") : t("action.allowed")}
        </span>
      ),
    },
  ];

  const networkFields: FieldDef[] = [
    { label: t("alertDetail.fieldSourceIp"), value: alert.src_ip, mono: true },
    {
      label: t("alertDetail.fieldSourcePort"),
      value: alert.src_port != null ? String(alert.src_port) : "--",
      mono: true,
    },
    { label: t("alertDetail.fieldDestIp"), value: alert.dest_ip, mono: true },
    {
      label: t("alertDetail.fieldDestPort"),
      value: alert.dest_port != null ? String(alert.dest_port) : "--",
      mono: true,
    },
    {
      label: t("alertDetail.fieldProtocol"),
      value: null,
      render: () => (
        <span
          className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${protocolColor(alert.proto)}`}
        >
          {alert.proto ?? "--"}
        </span>
      ),
    },
    { label: t("alertDetail.fieldAppProtocol"), value: alert.app_proto ?? "--" },
  ];

  const technicalFields: FieldDef[] = [
    { label: t("alertDetail.fieldSignatureId"), value: alert.signature_id, mono: true },
    {
      label: t("alertDetail.fieldFlowId"),
      value: alert.flow_id != null ? String(alert.flow_id) : "--",
      mono: true,
    },
    { label: t("alertDetail.fieldCommunityId"), value: alert.community_id ?? "--", mono: true },
    { label: t("alertDetail.fieldInterface"), value: alert.in_iface ?? "--" },
    { label: t("alertDetail.fieldGid"), value: alert.gid, mono: true },
    { label: t("alertDetail.fieldRev"), value: alert.rev, mono: true },
    {
      label: t("alertDetail.fieldIngestedAt"),
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

  const httpContext = parseJsonField(alert.http_json);
  const dnsContext = parseJsonField(alert.dns_json);
  const tlsContext = parseJsonField(alert.tls_json);

  return (
    <div className="space-y-6">
      {/* Explain Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 text-sm font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t("alertDetail.explain")}
        </button>
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-app surface-2 overflow-hidden">
        <div className="border-b border-app px-5 py-3">
          <h2 className="text-sm font-semibold text-strong">{t("alertDetail.summary")}</h2>
        </div>
        <FieldList fields={summaryFields} />
      </div>

      {/* Network */}
      <div className="rounded-lg border border-app surface-2 overflow-hidden">
        <div className="border-b border-app px-5 py-3">
          <h2 className="text-sm font-semibold text-strong">{t("alertDetail.network")}</h2>
        </div>
        <FieldList fields={networkFields} />
      </div>

      {/* Technical Data (accordion) */}
      <div className="rounded-lg border border-app surface-2 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowTechnical((prev) => !prev)}
          className="flex w-full items-center justify-between px-5 py-3 text-left hover-surface-3 transition-colors"
        >
          <h2 className="text-sm font-semibold text-strong">{t("alertDetail.technical")}</h2>
          <span className="flex items-center gap-2 text-xs text-muted">
            {showTechnical ? t("alertDetail.hideTechnical") : t("alertDetail.showTechnical")}
            <svg
              viewBox="0 0 20 20"
              className={`h-4 w-4 transition-transform ${showTechnical ? "rotate-90" : "rotate-0"}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M7 5l6 5-6 5" />
            </svg>
          </span>
        </button>
        {showTechnical && (
          <div className="border-t border-app">
            <FieldList fields={technicalFields} />
          </div>
        )}
      </div>

      {/* Payload */}
      {alert.payload_printable && (
        <div className="rounded-lg border border-app surface-2 overflow-hidden">
          <div className="border-b border-app px-5 py-3">
            <h2 className="text-sm font-semibold text-strong">{t("alertDetail.payload")}</h2>
          </div>
          <pre className="overflow-x-auto p-5 text-xs font-mono text-muted leading-relaxed whitespace-pre-wrap break-all">
            {alert.payload_printable}
          </pre>
        </div>
      )}

      {/* HTTP Context */}
      {httpContext && (
        <div className="rounded-lg border border-app surface-2 overflow-hidden">
          <div className="border-b border-app px-5 py-3">
            <h2 className="text-sm font-semibold text-strong">{t("alertDetail.httpContext")}</h2>
          </div>
          <pre className="overflow-x-auto p-5 text-xs font-mono text-muted leading-relaxed">
            {JSON.stringify(httpContext, null, 2)}
          </pre>
        </div>
      )}

      {/* DNS Context */}
      {dnsContext && (
        <div className="rounded-lg border border-app surface-2 overflow-hidden">
          <div className="border-b border-app px-5 py-3">
            <h2 className="text-sm font-semibold text-strong">{t("alertDetail.dnsContext")}</h2>
          </div>
          <pre className="overflow-x-auto p-5 text-xs font-mono text-muted leading-relaxed">
            {JSON.stringify(dnsContext, null, 2)}
          </pre>
        </div>
      )}

      {/* TLS Context */}
      {tlsContext && (
        <div className="rounded-lg border border-app surface-2 overflow-hidden">
          <div className="border-b border-app px-5 py-3">
            <h2 className="text-sm font-semibold text-strong">{t("alertDetail.tlsContext")}</h2>
          </div>
          <pre className="overflow-x-auto p-5 text-xs font-mono text-muted leading-relaxed">
            {JSON.stringify(tlsContext, null, 2)}
          </pre>
        </div>
      )}

      {/* Explanation Modal */}
      <ExplanationModal
        alert={alert}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
