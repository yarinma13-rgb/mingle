"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreIcon, XIcon } from "@/components/dashboard/icons";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
};

// Mobile = bottom nav per PRODUCT_SPEC.md section 58. A bottom bar only
// comfortably fits ~5 tabs, so the primary items get their own tab and
// the rest live behind "More".
export function MobileBottomNav({
  primaryItems,
  moreItems,
}: {
  primaryItems: NavItem[];
  moreItems: NavItem[];
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = moreItems.some((item) => pathname === item.href);

  return (
    <>
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 flex items-end bg-black/40 md:hidden"
          onClick={() => setMoreOpen(false)}
        >
          <div
            role="dialog"
            aria-label="More navigation"
            onClick={(e) => e.stopPropagation()}
            className="w-full rounded-t-2xl border-t border-mingle-border bg-mingle-surface p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="font-display text-sm font-semibold text-mingle-white">
                More
              </span>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setMoreOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-mingle-text-secondary"
              >
                <XIcon size={16} />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium ${
                      active
                        ? "bg-mingle-cta/10 text-mingle-cta"
                        : "text-mingle-text-secondary"
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 flex min-h-14 border-t border-mingle-border bg-mingle-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
                active ? "text-mingle-cta" : "text-mingle-text-secondary"
              }`}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
            moreActive ? "text-mingle-cta" : "text-mingle-text-secondary"
          }`}
        >
          <MoreIcon size={20} />
          More
        </button>
      </nav>
    </>
  );
}
