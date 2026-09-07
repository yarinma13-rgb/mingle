"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreIcon, XIcon } from "@/components/dashboard/icons";
import { SignOutButton } from "@/components/settings/SignOutButton";
import { isNavHrefActive } from "@/lib/dashboard/nav-active";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
};

const MORE_HINTS: Record<string, string> = {
  "/saved": "Profiles you marked to come back to",
  "/profile/build": "Edit how you show up to companies",
  "/company-profile/build": "Edit how the company shows up to talent",
  "/settings": "Account details and sign out",
  "/connections": "Requests and people you already connected with",
  "/board": "Each relationship by stage",
  "/interviews": "Conversations you have scheduled",
  "/team": "Who can hire from this workspace",
};

export function MobileBottomNav({
  primaryItems,
  moreItems,
  userName,
  userInitials,
  userSubtitle,
  profileHref,
}: {
  primaryItems: NavItem[];
  moreItems: NavItem[];
  userName: string;
  userInitials: string;
  userSubtitle: string;
  profileHref: string;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = moreItems.some((item) =>
    isNavHrefActive(pathname, item.href),
  );

  return (
    <>
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 flex items-end bg-black/40 md:hidden"
          onClick={() => setMoreOpen(false)}
        >
          <div
            role="dialog"
            aria-label="More"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] w-full overflow-y-auto rounded-t-2xl border-t border-mingle-border bg-mingle-surface p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display text-sm font-semibold text-mingle-text">
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

            <Link
              href={profileHref}
              prefetch
              onClick={() => setMoreOpen(false)}
              className="mb-4 flex items-center gap-3 rounded-2xl border border-mingle-border bg-mingle-bg px-3.5 py-3"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-mingle-pink via-mingle-purple to-mingle-blue font-display text-xs font-bold text-white">
                {userInitials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-mingle-text">
                  {userName}
                </p>
                <p className="text-xs text-mingle-text-secondary">
                  {userSubtitle} · Open profile
                </p>
              </div>
            </Link>

            <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-mingle-text-secondary">
              In the product
            </p>
            <div className="flex flex-col gap-1">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const hint = MORE_HINTS[item.href];
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    prefetch
                    onClick={() => setMoreOpen(false)}
                    className={`flex items-start gap-3 rounded-[10px] px-3.5 py-3 ${
                      isNavHrefActive(pathname, item.href)
                        ? "bg-mingle-lavender text-mingle-accent-blue"
                        : "text-mingle-text-secondary"
                    }`}
                  >
                    <Icon size={18} className="mt-0.5 shrink-0" />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-mingle-text">
                        {item.label}
                      </span>
                      {hint ? (
                        <span className="mt-0.5 block text-xs leading-snug text-mingle-text-secondary">
                          {hint}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                );
              })}
            </div>

            <p className="mb-2 mt-4 px-1 text-[11px] font-semibold uppercase tracking-wide text-mingle-text-secondary">
              About mingle
            </p>
            <div className="flex flex-col gap-1">
              <Link
                href="/legal/terms"
                onClick={() => setMoreOpen(false)}
                className="rounded-[10px] px-3.5 py-3 text-sm font-medium text-mingle-text"
              >
                Terms of Service
              </Link>
              <Link
                href="/legal/privacy"
                onClick={() => setMoreOpen(false)}
                className="rounded-[10px] px-3.5 py-3 text-sm font-medium text-mingle-text"
              >
                Privacy Policy
              </Link>
            </div>

            <div className="mt-4 px-1">
              <SignOutButton className="mingle-btn-secondary w-full text-sm disabled:opacity-60" />
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
          const active = isNavHrefActive(pathname, item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              prefetch
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
                active ? "text-mingle-accent-blue" : "text-mingle-text-secondary"
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
            moreActive ? "text-mingle-accent-blue" : "text-mingle-text-secondary"
          }`}
        >
          <MoreIcon size={20} />
          More
        </button>
      </nav>
    </>
  );
}
