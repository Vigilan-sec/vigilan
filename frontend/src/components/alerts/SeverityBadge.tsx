import { severityColor, severityLabel } from "@/lib/utils";

interface SeverityBadgeProps {
  severity: number;
}

export default function SeverityBadge({ severity }: SeverityBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${severityColor(severity)}`}
    >
      {severityLabel(severity)}
    </span>
  );
}
