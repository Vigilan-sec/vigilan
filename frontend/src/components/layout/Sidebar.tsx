"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import NetworkSidebarPanel from "@/components/layout/NetworkSidebarPanel";
import { useAuth } from "@/components/auth/AuthProvider";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
};

const primaryNavItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: "▦" },
  { href: "/assistant", label: "Assistant", icon: "◉" },
];

const postRequestsNavItems: NavItem[] = [
  { href: "/security", label: "Security", icon: "⚔" },
];

const alertsNavItems: NavItem[] = [
  { href: "/alerts", label: "Alerts", icon: "⚠" },
  { href: "/flows", label: "Flows", icon: "⇄" },
  { href: "/events", label: "Events", icon: "☰" },
];

const secondaryNavItems: NavItem[] = [{ href: "/status", label: "Status", icon: "⏺" }];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [alertsExpanded, setAlertsExpanded] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("vigilan-sidebar");
    const next = saved === "collapsed";
    window.setTimeout(() => setCollapsed(next), 0);
    document.documentElement.dataset.sidebar = next ? "collapsed" : "expanded";
  }, []);

  function isActive(href: string): boolean {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const alertsActive = alertsNavItems.some((item) => isActive(item.href));
  const alertsOpen = alertsActive || alertsExpanded;

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem("vigilan-sidebar", next ? "collapsed" : "expanded");
      document.documentElement.dataset.sidebar = next ? "collapsed" : "expanded";
      return next;
    });
  };

  function renderNavLink(item: NavItem, nested = false) {
    if (item.adminOnly && !user?.is_admin) {
      return null;
    }

    const active = isActive(item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors sidebar-nav-item ${
          nested ? "ml-4" : ""
        } ${
          active
            ? "surface-3 text-strong"
            : "text-muted hover-surface-3 hover:text-strong"
        }`}
      >
        <span className="text-base leading-none w-5 text-center sidebar-icon">
          {item.icon}
        </span>
        <span className="sidebar-label">{item.label}</span>
        {active && (
          <span className="absolute right-3 h-1.5 w-1.5 rounded-full accent-dot" />
        )}
      </Link>
    );
  }

  const visibleSecondaryItems = secondaryNavItems.filter(
    (item) => !item.adminOnly || user?.is_admin,
  );

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen flex-col surface-2 border-r border-app sidebar-shell">
      <div className="flex items-center gap-2 border-b border-app px-4 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-md border accent-chip font-bold text-base">
          V
        </div>
        <div>
          <h1 className="sidebar-title text-sm font-bold tracking-wide text-strong">
            Vigilan IDS
          </h1>
          <p className="sidebar-subtitle text-[10px] font-medium text-subtle">
            Secure local SOC
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {primaryNavItems.map((item) => renderNavLink(item))}

        <button
          type="button"
          onClick={() => setAlertsExpanded((prev) => !prev)}
          className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors sidebar-nav-item ${
            alertsActive
              ? "surface-3 text-strong"
              : "text-muted hover-surface-3 hover:text-strong"
          }`}
          aria-expanded={alertsOpen}
          aria-controls="alerts-sidebar-group"
        >
          <span className="sidebar-icon w-5 text-center text-base leading-none">
            ⚠
          </span>
          <span className="sidebar-label flex-1 text-left">Requests</span>
          <span className="sidebar-label flex h-6 w-6 items-center justify-center">
            <svg
              viewBox="0 0 20 20"
              aria-hidden="true"
              className={`h-5 w-5 transition-transform ${alertsOpen ? "rotate-90" : "rotate-0"}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 5l6 5-6 5" />
            </svg>
          </span>
        </button>

        {alertsOpen && (
          <div id="alerts-sidebar-group" className="space-y-1">
            {alertsNavItems.map((item) => renderNavLink(item, true))}
          </div>
        )}

        {postRequestsNavItems.map((item) => renderNavLink(item))}

        {visibleSecondaryItems.length > 0 && (
          <>
            <div className="mx-3 my-3 border-t border-app" />
            {visibleSecondaryItems.map((item) => renderNavLink(item))}
          </>
        )}
      </nav>

      <NetworkSidebarPanel collapsed={collapsed} />

      <div className="flex items-center gap-2 border-t border-app px-5 py-3">
        <Link
          href="/settings"
          className="flex h-8 w-8 items-center justify-center rounded-md border btn-base"
          aria-label="Settings"
          title="Settings"
        >
          ⚙
        </Link>
        <p className="sidebar-footer-text flex-1 font-mono text-[10px] text-subtle">
          v0.1.0
        </p>
        <button
          type="button"
          onClick={toggleSidebar}
          className="rounded-md border px-2 py-1 text-xs btn-base"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-pressed={collapsed}
        >
          {collapsed ? ">>" : "<<"}
        </button>
      </div>
    </aside>
  );
}
