"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard", icon: "\u25A6" },
  { href: "/alerts", label: "Alerts", icon: "\u26A0" },
  { href: "/flows", label: "Flows", icon: "\u21C4" },
  { href: "/events", label: "Events", icon: "\u2630" },
  { href: "/status", label: "Status", icon: "\u2699" },
];

export default function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-56 flex-col bg-zinc-900 border-r border-zinc-800">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-zinc-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-500/20 text-green-400 font-bold text-sm">
          V
        </div>
        <div>
          <h1 className="text-sm font-bold text-zinc-100 tracking-wide">
            Vigilan IDS
          </h1>
          <p className="text-[10px] text-zinc-500 font-medium">
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
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
              }`}
            >
              <span className="text-base leading-none w-5 text-center">
                {item.icon}
              </span>
              {item.label}
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-green-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-zinc-800 px-5 py-3">
        <p className="text-[10px] text-zinc-600 font-mono">v0.1.0</p>
      </div>
    </aside>
  );
}
