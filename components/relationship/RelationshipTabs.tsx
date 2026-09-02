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
    <div className="flex gap-1 overflow-x-auto overscroll-x-contain rounded-full border border-mingle-border bg-mingle-surface p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`min-h-11 shrink-0 rounded-full px-4 py-2.5 text-xs font-semibold transition-colors ${
              active
                ? "bg-mingle-cta text-white"
                : "text-mingle-text-secondary hover:text-mingle-white"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
