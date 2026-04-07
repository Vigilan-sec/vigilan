"use client";

import LiveIndicator from "@/components/shared/LiveIndicator";
import type { WsStatus } from "@/hooks/useWebSocket";
import ThemeSelector from "@/components/layout/ThemeSelector";
import { useAuth } from "@/components/auth/AuthProvider";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "@/hooks/useTranslation";

interface HeaderProps {
  title: string;
  wsStatus: WsStatus;
}

export default function Header({ title, wsStatus }: HeaderProps) {
  const { user, logout } = useAuth();
  const { lang, setLang } = useLanguage();
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-app surface-1 backdrop-blur-sm px-6 py-4">
      <h1 className="text-lg font-semibold text-strong">{title}</h1>
      <div className="flex items-center gap-4">
        <LiveIndicator status={wsStatus} />
        <div className="flex items-center rounded-md border border-app overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => setLang("fr")}
            className={`px-2.5 py-1 transition-colors ${lang === "fr" ? "accent-chip font-semibold" : "text-muted hover:text-strong"}`}
            aria-pressed={lang === "fr"}
          >
            FR
          </button>
          <button
            type="button"
            onClick={() => setLang("en")}
            className={`px-2.5 py-1 transition-colors ${lang === "en" ? "accent-chip font-semibold" : "text-muted hover:text-strong"}`}
            aria-pressed={lang === "en"}
          >
            EN
          </button>
        </div>
        <ThemeSelector />
        {user && (
          <div className="flex items-center gap-2 rounded-full border border-app surface-2 px-3 py-1.5">
            <div className="text-right">
              <p className="text-xs font-semibold text-strong">{user.username}</p>
              <p className="text-[10px] uppercase tracking-wide text-subtle">
                {user.is_admin ? t("auth.admin") : t("auth.analyst")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-md border border-app px-2 py-1 text-[11px] text-subtle transition-colors hover:text-strong"
            >
              {t("auth.logout")}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
