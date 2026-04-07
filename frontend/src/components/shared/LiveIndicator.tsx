"use client";

import type { WsStatus } from "@/hooks/useWebSocket";
import { useTranslation } from "@/hooks/useTranslation";
import type { TranslationKey } from "@/lib/i18n/translations";

interface LiveIndicatorProps {
  status: WsStatus;
}

const statusConfig: Record<WsStatus, { color: string; pulse: boolean; labelKey: TranslationKey }> = {
  connected: {
    color: "bg-green-500",
    pulse: true,
    labelKey: "live.connected",
  },
  connecting: {
    color: "bg-yellow-500",
    pulse: true,
    labelKey: "live.connecting",
  },
  disconnected: {
    color: "bg-red-500",
    pulse: false,
    labelKey: "live.disconnected",
  },
};

export default function LiveIndicator({ status }: LiveIndicatorProps) {
  const { t } = useTranslation();
  const config = statusConfig[status];

  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-muted">
      <span className="relative flex h-2.5 w-2.5">
        {config.pulse && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${config.color}`}
          />
        )}
        <span
          className={`relative inline-flex h-2.5 w-2.5 rounded-full ${config.color}`}
        />
      </span>
      {t(config.labelKey)}
    </span>
  );
}
