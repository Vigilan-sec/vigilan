"use client";

import type { WsStatus } from "@/hooks/useWebSocket";

interface LiveIndicatorProps {
  status: WsStatus;
}

const statusConfig: Record<WsStatus, { color: string; pulse: boolean; label: string }> = {
  connected: {
    color: "bg-green-500",
    pulse: true,
    label: "Live",
  },
  connecting: {
    color: "bg-yellow-500",
    pulse: true,
    label: "Connecting",
  },
  disconnected: {
    color: "bg-red-500",
    pulse: false,
    label: "Disconnected",
  },
};

export default function LiveIndicator({ status }: LiveIndicatorProps) {
  const config = statusConfig[status];

  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400">
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
      {config.label}
    </span>
  );
}
