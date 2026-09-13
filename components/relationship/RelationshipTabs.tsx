"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnalyticsEvent } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";

export function RelationshipTabs({ connectionId }: { connectionId: string }) {
  const pathname = usePathname();
  const base = `/conversations/${connectionId}`;
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const tabs = [
    { label: "Conversation", href: base },
    { label: "Explore", href: `${base}/explore` },
    { label: "Opportunity", href: `${base}/opportunity` },
    { label: "Decision", href: `${base}/decision` },
  ];

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  return (
    <div
      role="tablist"
      aria-label="Relationship stages"
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
              track(AnalyticsEvent.relationshipTabClicked, {
                connection_id: connectionId,
                tab: tab.label.toLowerCase(),
              });
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
