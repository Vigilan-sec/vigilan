"use client";

import LiveIndicator from "@/components/shared/LiveIndicator";
import type { WsStatus } from "@/hooks/useWebSocket";
import ThemeSelector from "@/components/layout/ThemeSelector";
import { useAuth } from "@/components/auth/AuthProvider";

interface HeaderProps {
  title: string;
  wsStatus: WsStatus;
}

export default function Header({ title, wsStatus }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-app surface-1 backdrop-blur-sm px-6 py-4">
      <h1 className="text-lg font-semibold text-strong">{title}</h1>
      <div className="flex items-center gap-4">
        <LiveIndicator status={wsStatus} />
        <ThemeSelector />
        {user && (
          <div className="flex items-center gap-2 rounded-full border border-app surface-2 px-3 py-1.5">
            <div className="text-right">
              <p className="text-xs font-semibold text-strong">{user.username}</p>
              <p className="text-[10px] uppercase tracking-wide text-subtle">
                {user.is_admin ? "admin" : "analyst"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-md border border-app px-2 py-1 text-[11px] text-subtle transition-colors hover:text-strong"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
