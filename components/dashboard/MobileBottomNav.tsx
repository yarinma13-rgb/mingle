"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreIcon, XIcon } from "@/components/dashboard/icons";
import { NavPendingIndicator } from "@/components/dashboard/NavPendingIndicator";
import { SignOutButton } from "@/components/settings/SignOutButton";
import { isNavHrefActive } from "@/lib/dashboard/nav-active";
import { Avatar } from "@/components/Avatar";
import type { Gender } from "@/lib/profile/avatar";
import { ThemeSwitch } from "@/components/theme/ThemeSwitch";
import { SeePlansButton } from "@/components/plans/SeePlansButton";

type NavItem = {
  label: string;
  shortLabel?: string;
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
  userGender = null,
  userPhoto = null,
  userSubtitle,
  profileHref,
  avatarShape = "circle",
}: {
  primaryItems: NavItem[];
  moreItems: NavItem[];
  userName: string;
  userInitials: string;
  userGender?: Gender | null;
  userPhoto?: string | null;
  userSubtitle: string;
  profileHref: string;
  avatarShape?: "circle" | "soft";
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
            className="max-h-[85vh] w-full overflow-y-auto rounded-t-[1.25rem] border-t border-mingle-border bg-mingle-surface p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgba(28,27,46,0.12)]"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display text-sm font-semibold tracking-tight text-mingle-text">
                More
              </span>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setMoreOpen(false)}
                className="mingle-icon-btn h-8 w-8 rounded-full"
              >
                <XIcon size={16} />
              </button>
            </div>

            <Link
              href={profileHref}
              prefetch
              onClick={() => setMoreOpen(false)}
              className="mb-4 flex items-center gap-3 rounded-[var(--mingle-radius-card)] border border-mingle-border bg-mingle-bg px-3.5 py-3 transition-colors hover:bg-mingle-lavender/60"
            >
              <Avatar
                photo={userPhoto}
                initials={userInitials}
                gender={userGender}
                size="md"
                shape={avatarShape}
              />
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
                    className={`flex items-start gap-3 rounded-[var(--mingle-radius)] px-3.5 py-3 transition-colors ${
                      isNavHrefActive(pathname, item.href)
                        ? "bg-mingle-nav-active-bg text-mingle-accent-purple"
                        : "text-mingle-text-secondary hover:bg-mingle-nav-hover-bg"
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
              <SeePlansButton />
            </div>

            <div className="mt-4 flex items-center justify-between rounded-[10px] border border-mingle-border bg-mingle-bg px-3.5 py-3">
              <ThemeSwitch compact />
            </div>

            <div className="mt-4 px-1">
              <SignOutButton className="mingle-btn-secondary w-full text-sm disabled:opacity-60" />
            </div>
          </div>
        </div>
      )}

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 flex min-h-14 items-stretch gap-x-0.5 border-t border-mingle-border/80 bg-mingle-surface/95 px-1.5 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur-md md:hidden"
      >
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const active = isNavHrefActive(pathname, item.href);
          const tabLabel = item.shortLabel ?? item.label;
          return (
            <Link
              key={item.label}
              href={item.href}
              prefetch
              aria-label={item.label}
              className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-0.5 py-2 text-center text-[10px] font-medium leading-none tracking-tight transition-colors ${
                active ? "text-mingle-accent-purple" : "text-mingle-text-secondary"
              }`}
            >
              <span className="relative flex h-5 w-5 items-center justify-center">
                <NavPendingIndicator />
                <Icon size={20} className="relative" />
              </span>
              <span className="max-w-full truncate">{tabLabel}</span>
              {active ? (
                <span
                  aria-hidden
                  className="absolute inset-x-3 bottom-0.5 h-0.5 rounded-full bg-mingle-accent-purple/80"
                />
              ) : null}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-0.5 py-2 text-center text-[10px] font-medium leading-none tracking-tight transition-colors ${
            moreActive ? "text-mingle-accent-purple" : "text-mingle-text-secondary"
          }`}
        >
          <MoreIcon size={20} />
          <span>More</span>
          {moreActive ? (
            <span
              aria-hidden
              className="absolute inset-x-3 bottom-0.5 h-0.5 rounded-full bg-mingle-accent-purple/80"
            />
          ) : null}
        </button>
      </nav>
    </>
  );
}
