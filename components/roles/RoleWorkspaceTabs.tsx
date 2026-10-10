"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function RoleWorkspaceTabs({ roleId }: { roleId: string }) {
  const pathname = usePathname();
  const base = `/roles/${roleId}`;
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  if (
    pendingHref &&
    (pathname === pendingHref ||
      (pendingHref !== base && pathname.startsWith(`${pendingHref}/`)))
  ) {
    setPendingHref(null);
  }

  const tabs = [
    { label: "Pipeline", href: base },
    { label: "Matches", href: `${base}/matches` },
    { label: "Team access", href: `${base}/team` },
  ];

  return (
    <div
      role="tablist"
      aria-label="Role workspace"
      className="inline-flex max-w-full items-center gap-1 overflow-x-auto overscroll-x-contain rounded-full border border-mingle-border bg-mingle-surface p-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {tabs.map((tab) => {
        const routeActive =
          tab.href === base
            ? pathname === base
            : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        const active = pendingHref ? pendingHref === tab.href : routeActive;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            prefetch
            scroll={false}
            role="tab"
            aria-selected={active}
            aria-current={active ? "page" : undefined}
            onClick={() => {
              if (!routeActive) setPendingHref(tab.href);
            }}
            className={`inline-flex h-9 shrink-0 items-center justify-center rounded-full px-4 text-xs font-semibold leading-none transition-colors ${
              active
                ? "bg-mingle-cta text-white shadow-sm"
                : "text-mingle-text-secondary hover:bg-mingle-bg/70 hover:text-mingle-text"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
