"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/", label: "Dashboard", icon: "\u25A6" },
  { href: "/alerts", label: "Alerts", icon: "\u26A0" },
  { href: "/flows", label: "Flows", icon: "\u21C4" },
  { href: "/events", label: "Events", icon: "\u2630" },
  { href: "/status", label: "Status", icon: "\u2699" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("vigilan-sidebar");
    const next = saved === "collapsed";
    setCollapsed(next);
    document.documentElement.dataset.sidebar = next ? "collapsed" : "expanded";
  }, []);

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem("vigilan-sidebar", next ? "collapsed" : "expanded");
      document.documentElement.dataset.sidebar = next ? "collapsed" : "expanded";
      return next;
    });
  };

  function isActive(href: string): boolean {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen flex-col surface-2 border-r border-app sidebar-shell">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-app">
        <div className="flex h-9 w-9 items-center justify-center rounded-md accent-chip border font-bold text-base">
          V
        </div>
        <div>
          <h1 className="text-sm font-bold text-strong tracking-wide sidebar-title">
            Vigilan IDS
          </h1>
          <p className="text-[10px] text-subtle font-medium sidebar-subtitle">
            Intrusion Detection
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors sidebar-nav-item ${
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
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-app px-5 py-3 flex items-center gap-2">
        <button
          type="button"
          onClick={toggleSidebar}
          className="rounded-md border px-2 py-1 text-xs btn-base"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-pressed={collapsed}
        >
          {collapsed ? ">>" : "<<"}
        </button>
        <p className="text-[10px] text-subtle font-mono sidebar-footer-text">v0.1.0</p>
      </div>
    </aside>
  );
}
