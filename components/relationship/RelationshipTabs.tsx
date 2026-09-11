"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function RelationshipTabs({ connectionId }: { connectionId: string }) {
  const pathname = usePathname();
  const base = `/conversations/${connectionId}`;
  const tabs = [
    { label: "Conversation", href: base },
    { label: "Explore", href: `${base}/explore` },
    { label: "Opportunity", href: `${base}/opportunity` },
    { label: "Decision", href: `${base}/decision` },
  ];

  return (
    <div
      role="tablist"
      aria-label="Relationship stages"
      className="inline-flex max-w-full items-center gap-1 overflow-x-auto overscroll-x-contain rounded-full border border-mingle-border bg-mingle-surface p-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            role="tab"
            aria-selected={active}
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
