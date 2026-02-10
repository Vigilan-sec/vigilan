// Fonction utilitaire pour formater les grands nombres de ton Dashboard VigiLAN
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('fr-FR').format(num);
}

export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString("fr-FR");
}

export function formatFullDate(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString("fr-FR", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes)) return "--";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  const digits = value >= 100 || index === 0 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(digits)} ${units[index]}`;
}

export function protocolColor(proto: string | null | undefined): string {
  const normalized = (proto ?? "").toLowerCase();
  const colors: Record<string, string> = {
    tcp: "bg-blue-500/20 text-blue-400",
    udp: "bg-emerald-500/20 text-emerald-400",
    icmp: "bg-amber-500/20 text-amber-400",
    http: "bg-sky-500/20 text-sky-400",
    dns: "bg-cyan-500/20 text-cyan-400",
    tls: "bg-purple-500/20 text-purple-400",
  };
  return colors[normalized] ?? "chip-muted";
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