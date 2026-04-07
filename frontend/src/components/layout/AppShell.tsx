"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTranslation } from "@/hooks/useTranslation";

const PUBLIC_PATHS = new Set(["/login"]);

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center surface-1">
      <div className="rounded-xl border border-app surface-2 px-6 py-5 text-sm text-subtle">
        {message}
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  const isPublicRoute = PUBLIC_PATHS.has(pathname);
  const shouldRedirect = !isPublicRoute && !loading && !user;

  useEffect(() => {
    if (!shouldRedirect) return;
    const next = pathname && pathname !== "/login" ? `?next=${encodeURIComponent(pathname)}` : "";
    router.replace(`/login${next}`);
  }, [pathname, router, shouldRedirect]);

  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (loading) {
    return <LoadingScreen message={t("shell.checkingSession")} />;
  }

  if (!user) {
    return <LoadingScreen message={t("shell.redirecting")} />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1" style={{ marginLeft: "var(--sidebar-width)" }}>
        {children}
      </main>
    </div>
  );
}
