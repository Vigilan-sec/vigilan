// Fonction utilitaire pour formater les grands nombres de ton Dashboard VigiLAN
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('fr-FR').format(num);
}

export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('fr-FR');
}

type SeverityMeta = {
  label: string;
  className: string;
};

const severityMap: Record<number, SeverityMeta> = {
  1: {
    label: "Critical",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  2: {
    label: "High",
    className: "bg-orange-50 text-orange-700 border-orange-200",
  },
  3: {
    label: "Medium",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  4: {
    label: "Low",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};

const defaultSeverity: SeverityMeta = {
  label: "Unknown",
  className: "bg-slate-50 text-slate-600 border-slate-200",
};

export function severityLabel(severity: number): string {
  return severityMap[severity]?.label ?? defaultSeverity.label;
}

export function severityColor(severity: number): string {
  return severityMap[severity]?.className ?? defaultSeverity.className;
}