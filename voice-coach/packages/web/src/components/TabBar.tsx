"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Practice", icon: "🎙" },
  { href: "/history", label: "History", icon: "📋" },
  { href: "/progress", label: "Progress", icon: "📈" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
] as const;

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-card border-t border-navy z-50">
      <div className="flex">
        {TABS.map(({ href, label, icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs transition-colors ${
                active ? "text-brand" : "text-muted"
              }`}
            >
              <span className="text-xl leading-none">{icon}</span>
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
