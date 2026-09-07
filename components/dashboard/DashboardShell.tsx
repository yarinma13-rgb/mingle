"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MingleLogo } from "@/components/MingleLogo";
import { useCommandPalette } from "@/components/command-palette/CommandPaletteProvider";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import {
  SearchIcon,
  GridIcon,
  PeopleIcon,
  FunnelIcon,
  ColumnsIcon,
  GearIcon,
  CompassIcon,
  MessageIcon,
  UserIcon,
  BriefcaseIcon,
  CalendarIcon,
  BookmarkIcon,
} from "@/components/dashboard/icons";
import type { UserType } from "@/lib/supabase/types";
import { isNavHrefActive } from "@/lib/dashboard/nav-active";
import { Avatar } from "@/components/Avatar";
import type { Gender } from "@/lib/profile/avatar";
import { ThemeSwitch } from "@/components/theme/ThemeSwitch";
import { SeePlansButton } from "@/components/plans/SeePlansButton";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  dividerAfter?: boolean;
};

const COMPANY_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: GridIcon },
  { label: "Roles", href: "/roles", icon: BriefcaseIcon },
  { label: "Candidates", href: "/discover", icon: PeopleIcon, dividerAfter: true },
  { label: "Conversations", href: "/conversations", icon: MessageIcon },
  { label: "Pipeline", href: "/connections", icon: FunnelIcon },
  { label: "Board", href: "/board", icon: ColumnsIcon, dividerAfter: true },
  { label: "Interviews", href: "/interviews", icon: CalendarIcon },
  { label: "Team", href: "/team", icon: PeopleIcon },
  { label: "My profile", href: "/company-profile/build", icon: UserIcon },
  { label: "Settings", href: "/settings", icon: GearIcon },
];

const COMPANY_NAV_PRIMARY = COMPANY_NAV.slice(0, 4);
const COMPANY_NAV_MORE = COMPANY_NAV.slice(4);

const TALENT_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: GridIcon },
  { label: "Discover", href: "/discover", icon: CompassIcon },
  { label: "Connections", href: "/connections", icon: PeopleIcon },
  { label: "Conversations", href: "/conversations", icon: MessageIcon, dividerAfter: true },
  { label: "Saved", href: "/saved", icon: BookmarkIcon },
  { label: "My profile", href: "/profile/build", icon: UserIcon },
  { label: "Settings", href: "/settings", icon: GearIcon },
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
  userGender?: Gender | null;
  userPhoto?: string | null;
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
  userGender = null,
  userPhoto = null,
  userSubtitle,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { openPalette, enabled: paletteEnabled } = useCommandPalette();
  const isCompany = userType === "company";
  const navItems = isCompany ? COMPANY_NAV : TALENT_NAV;
  const primaryItems = isCompany ? COMPANY_NAV_PRIMARY : TALENT_NAV_PRIMARY;
  const moreItems = isCompany ? COMPANY_NAV_MORE : TALENT_NAV_MORE;

  useEffect(() => {
    for (const item of navItems) {
      router.prefetch(item.href);
    }
  }, [navItems, router]);

  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      <header className="relative z-30 flex min-h-[4.75rem] w-full shrink-0 items-center gap-3 overflow-visible border-b border-mingle-border/70 bg-transparent px-4 pt-[env(safe-area-inset-top)] sm:gap-6 sm:px-6 md:bg-transparent">
        <div className="md:hidden">
          <MingleLogo variant="mark" size={72} priority />
        </div>

        <div className="hidden flex-1 justify-center md:flex">
          <div className="relative w-full max-w-md">
            <SearchIcon
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mingle-accent-blue"
            />
            <button
              type="button"
              onClick={openPalette}
              disabled={!paletteEnabled}
              className="w-full rounded-[10px] border border-mingle-border bg-mingle-white py-2.5 pl-10 pr-4 text-left text-sm text-mingle-text-secondary transition-colors hover:border-mingle-blue hover:text-mingle-text focus:border-mingle-blue focus:outline-none disabled:opacity-60"
            >
              {searchPlaceholder}
            </button>
          </div>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2.5 sm:ml-0 sm:gap-4">
          <button
            type="button"
            aria-label="Search"
            onClick={openPalette}
            disabled={!paletteEnabled}
            className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-mingle-border bg-mingle-white text-mingle-text-secondary transition-colors hover:text-mingle-text disabled:opacity-60 md:hidden"
          >
            <SearchIcon size={16} />
          </button>

          <SeePlansButton compact />

          <NotificationBell userId={userId} />

          <div className="flex items-center gap-2.5">
            <Avatar
              photo={userPhoto}
              initials={userInitials}
              gender={userGender}
              size="sm"
            />
            <div className="hidden leading-tight sm:block">
              <p className="text-sm font-semibold text-mingle-text">
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
        <aside className="hidden w-[6.25rem] shrink-0 flex-col items-center self-stretch bg-transparent px-2 py-5 md:flex">
          <div className="mb-5 flex w-full items-center justify-center px-1">
            <MingleLogo variant="mark" size={58} priority />
          </div>
          {navItems.map((item) => {
            const active = isNavHrefActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex w-full flex-col items-center">
                <Link
                  href={item.href}
                  prefetch
                  className="group flex w-full flex-col items-center gap-1.5 py-3"
                >
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-colors ${
                      active
                        ? "bg-mingle-nav-active-bg"
                        : "bg-transparent group-hover:bg-mingle-nav-hover-bg"
                    }`}
                  >
                    <Icon
                      size={20}
                      className={
                        active
                          ? "text-mingle-nav-active"
                          : "text-mingle-nav-idle group-hover:text-mingle-nav-active"
                      }
                    />
                  </span>
                  <span
                    className={`max-w-[4.75rem] text-center text-[10px] font-medium leading-tight ${
                      active
                        ? "text-mingle-nav-active"
                        : "text-mingle-nav-idle"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
                {item.dividerAfter ? (
                  <div
                    aria-hidden
                    className="my-3 h-px w-[3.25rem] bg-mingle-nav-divider"
                  />
                ) : null}
              </div>
            );
          })}
          <div className="mt-auto flex w-full flex-col items-center pb-2 pt-6">
            <ThemeSwitch />
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-5 pb-24 pt-8 sm:px-10 sm:py-9 md:pb-10">
          <h1 className="mb-8 font-display text-[1.75rem] font-bold tracking-tight text-mingle-text sm:mb-9 sm:text-3xl">
            {title}
          </h1>

          {children}
        </main>
      </div>

      <MobileBottomNav
        primaryItems={primaryItems}
        moreItems={moreItems}
        userName={userName}
        userInitials={userInitials}
        userGender={userGender}
        userPhoto={userPhoto}
        userSubtitle={userSubtitle}
        profileHref={
          isCompany ? "/company-profile/build" : "/profile/build"
        }
      />
    </div>
  );
}
