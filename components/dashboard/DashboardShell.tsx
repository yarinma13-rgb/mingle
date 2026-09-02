"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MingleLogo } from "@/components/MingleLogo";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import {
  SearchIcon,
  GridIcon,
  BriefcaseIcon,
  PeopleIcon,
  FunnelIcon,
  ColumnsIcon,
  CalendarIcon,
  GearIcon,
  CompassIcon,
  MessageIcon,
  BookmarkIcon,
  UserIcon,
} from "@/components/dashboard/icons";
import type { UserType } from "@/lib/supabase/types";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
};

// Icon components can't cross the server/client boundary as props, so the
// nav is defined here (already a client component) and picked by userType,
// rather than passed in from the server page.
const COMPANY_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: GridIcon },
  { label: "Roles", href: "/dashboard", icon: BriefcaseIcon },
  { label: "Candidates", href: "/discover", icon: PeopleIcon },
  { label: "Conversations", href: "/conversations", icon: MessageIcon },
  { label: "Pipeline", href: "/connections", icon: FunnelIcon },
  { label: "Board", href: "/board", icon: ColumnsIcon },
  { label: "Interviews", href: "/dashboard", icon: CalendarIcon },
  { label: "Team", href: "/dashboard", icon: PeopleIcon },
  { label: "My profile", href: "/company-profile/build", icon: UserIcon },
  { label: "Settings", href: "/dashboard", icon: GearIcon },
];

// Bottom nav only comfortably fits ~5 tabs on a phone screen (spec section
// 58's "single column ... bottom nav"), so each list's first four become
// the primary tabs and the rest live behind "More".
const COMPANY_NAV_PRIMARY = COMPANY_NAV.slice(0, 4);
const COMPANY_NAV_MORE = COMPANY_NAV.slice(4);

const TALENT_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: GridIcon },
  { label: "Discover", href: "/discover", icon: CompassIcon },
  { label: "Connections", href: "/connections", icon: PeopleIcon },
  { label: "Conversations", href: "/conversations", icon: MessageIcon },
  { label: "Saved", href: "/dashboard", icon: BookmarkIcon },
  { label: "My profile", href: "/profile/build", icon: UserIcon },
  { label: "Settings", href: "/dashboard", icon: GearIcon },
];
const TALENT_NAV_PRIMARY = TALENT_NAV.slice(0, 4);
const TALENT_NAV_MORE = TALENT_NAV.slice(4);

type DashboardShellProps = {
  userType: UserType;
  userId: string;
  title: string;
  searchPlaceholder: string;
  userName: string;
  userInitials: string;
  userSubtitle: string;
  children: React.ReactNode;
};

export function DashboardShell({
  userType,
  userId,
  title,
  searchPlaceholder,
  userName,
  userInitials,
  userSubtitle,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const isCompany = userType === "company";
  const navItems = isCompany ? COMPANY_NAV : TALENT_NAV;
  const primaryItems = isCompany ? COMPANY_NAV_PRIMARY : TALENT_NAV_PRIMARY;
  const moreItems = isCompany ? COMPANY_NAV_MORE : TALENT_NAV_MORE;

  return (
    <div data-theme="light" className="flex min-h-screen flex-col bg-mingle-bg">
      <header
        data-theme="dark"
        className="relative z-30 flex min-h-16 w-full shrink-0 items-center gap-3 overflow-visible border-b border-mingle-border bg-mingle-bg px-4 pt-[env(safe-area-inset-top)] sm:gap-6 sm:px-6"
      >
        {/* Compact logo on mobile, full lockup from sm up (spec: "compact
            logo" on mobile). The responsive show/hide classes live on a
            plain wrapper rather than passed into MingleLogo's own
            className, because that component already hardcodes
            "inline-flex" on the same element — combined with "hidden"
            there, the two unconditional display utilities raced and both
            logos ended up rendering at once below the sm breakpoint. */}
        <div className="sm:hidden">
          <MingleLogo variant="mark" size={26} priority />
        </div>
        <div className="hidden sm:block">
          <MingleLogo variant="lockup" size={22} priority />
        </div>

        <div className="hidden flex-1 justify-center md:flex">
          <div className="relative w-full max-w-md">
            <SearchIcon
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mingle-text-secondary"
            />
            <input
              type="search"
              placeholder={searchPlaceholder}
              className="w-full rounded-full border border-mingle-border bg-mingle-surface py-2.5 pl-10 pr-4 text-sm text-mingle-white placeholder:text-mingle-text-secondary focus:border-mingle-purple focus:outline-none"
            />
          </div>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2.5 sm:ml-0 sm:gap-4">
          <button
            type="button"
            aria-label="Search"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-mingle-border bg-mingle-surface text-mingle-text-secondary transition-colors hover:text-mingle-white md:hidden"
          >
            <SearchIcon size={16} />
          </button>

          <NotificationBell userId={userId} />

          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-mingle-pink to-mingle-purple font-display text-xs font-bold text-white">
              {userInitials}
            </div>
            <div className="hidden leading-tight sm:block">
              <p className="text-sm font-semibold text-mingle-white">
                {userName}
              </p>
              <p className="text-xs text-mingle-text-secondary">
                {userSubtitle}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar is desktop only — mobile gets a bottom nav instead
            (PRODUCT_SPEC.md section 58). */}
        <aside className="hidden w-60 shrink-0 flex-col gap-1 border-r border-mingle-border bg-mingle-surface p-4 md:flex">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-mingle-cta/10 text-mingle-cta"
                    : "text-mingle-text-secondary hover:bg-mingle-bg hover:text-mingle-white"
                }`}
              >
                <Icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </aside>

        <main className="min-w-0 flex-1 px-4 pb-24 pt-6 sm:px-8 sm:py-7 md:pb-7">
          <h1 className="mb-6 font-display text-2xl font-bold text-mingle-white sm:mb-7">
            {title}
          </h1>

          {children}
        </main>
      </div>

      <MobileBottomNav primaryItems={primaryItems} moreItems={moreItems} />
    </div>
  );
}
