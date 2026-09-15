"use client";

import { MingleLogo } from "@/components/MingleLogo";
import { Avatar } from "@/components/Avatar";
import { ThemeSwitch } from "@/components/theme/ThemeSwitch";
import {
  GridIcon,
  BriefcaseIcon,
  PeopleIcon,
  MessageIcon,
  FunnelIcon,
  ColumnsIcon,
  CalendarIcon,
  UserIcon,
  GearIcon,
  CompassIcon,
  BookmarkIcon,
  SearchIcon,
  HelpIcon,
} from "@/components/dashboard/icons";
import { DEMO_COMPANY, DEMO_EMMA } from "@/lib/demo/data";
import type { DemoAudience } from "@/lib/demo/scenes";

type NavItem = {
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  dividerAfter?: boolean;
};

const COMPANY_NAV: NavItem[] = [
  { label: "Dashboard", icon: GridIcon },
  { label: "Roles", icon: BriefcaseIcon },
  { label: "Candidates", icon: PeopleIcon, dividerAfter: true },
  { label: "Conversations", icon: MessageIcon },
  { label: "Pipeline", icon: FunnelIcon },
  { label: "Board", icon: ColumnsIcon, dividerAfter: true },
  { label: "Interviews", icon: CalendarIcon },
  { label: "My profile", icon: UserIcon },
  { label: "Settings", icon: GearIcon },
];

const TALENT_NAV: NavItem[] = [
  { label: "Dashboard", icon: GridIcon },
  { label: "Discover", icon: CompassIcon },
  { label: "Connections", icon: PeopleIcon },
  { label: "Conversations", icon: MessageIcon, dividerAfter: true },
  { label: "Saved", icon: BookmarkIcon },
  { label: "My profile", icon: UserIcon },
  { label: "Settings", icon: GearIcon },
];

/**
 * Visual twin of the live DashboardShell — narrow icon rail, header search,
 * theme toggle — without live routing or auth.
 */
export function DemoChrome({
  activeNav,
  title,
  audience = "company",
  children,
  onNavSelect,
  fillMain = false,
}: {
  activeNav: string;
  title: string;
  audience?: DemoAudience;
  children: React.ReactNode;
  onNavSelect?: (label: string) => void;
  fillMain?: boolean;
}) {
  const nav = audience === "talent" ? TALENT_NAV : COMPANY_NAV;
  const isCompany = audience === "company";
  const accountName = isCompany ? DEMO_COMPANY.name : DEMO_EMMA.name;
  const accountInitials = isCompany ? DEMO_COMPANY.initials : DEMO_EMMA.initials;
  const accountSubtitle = isCompany ? "Hiring workspace" : DEMO_EMMA.headline;
  const searchLabel = isCompany ? "Search candidates" : "Search companies";

  return (
    <div className="demo-chrome flex h-full min-h-0 w-full overflow-hidden rounded-2xl border border-mingle-border/80 bg-transparent shadow-[0_20px_60px_rgba(37,34,56,0.08)]">
      <aside className="mingle-app-sidebar hidden w-[6.25rem] shrink-0 flex-col items-center self-stretch overflow-y-auto bg-mingle-sidebar px-2 md:flex">
        <div className="flex h-[4.75rem] w-full shrink-0 items-center justify-center pt-1">
          <MingleLogo variant="mark" size={41} priority />
        </div>
        <div className="flex w-full flex-1 flex-col items-center gap-0.5 pb-5 pt-2">
          <nav aria-label="Demo navigation" className="flex w-full flex-col items-center">
            {nav.map((item) => {
              const active = item.label === activeNav;
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex w-full flex-col items-center">
                  <button
                    type="button"
                    onClick={() => onNavSelect?.(item.label)}
                    className="group flex w-full flex-col items-center gap-1.5 py-2"
                  >
                    <span
                      className={`relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                        active
                          ? "bg-mingle-nav-active-bg"
                          : "bg-transparent group-hover:bg-mingle-nav-hover-bg"
                      }`}
                    >
                      <Icon
                        size={18}
                        className={
                          active
                            ? "text-mingle-nav-active"
                            : "text-mingle-nav-idle group-hover:text-mingle-nav-active"
                        }
                      />
                    </span>
                    <span
                      className={`max-w-[5.25rem] px-0.5 text-center text-[10px] font-medium leading-snug ${
                        active
                          ? "text-mingle-nav-active"
                          : "text-mingle-nav-idle"
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                  {item.dividerAfter ? (
                    <div
                      aria-hidden
                      className="my-1.5 h-px w-[2.75rem] bg-mingle-nav-divider"
                    />
                  ) : null}
                </div>
              );
            })}
          </nav>
          <div className="mt-auto flex w-full flex-col items-center pb-2 pt-6">
            <ThemeSwitch />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-transparent">
        <header className="relative z-30 flex min-h-[4.25rem] w-full shrink-0 items-center gap-3 border-b border-mingle-border/70 bg-transparent px-4 pb-2 pt-2 sm:min-h-[4.75rem] sm:gap-6 sm:px-6 sm:pb-0">
          <div className="shrink-0 md:hidden">
            <MingleLogo variant="mark" size={34} priority />
          </div>

          <div className="hidden flex-1 justify-center md:flex">
            <div className="relative w-full max-w-md">
              <SearchIcon
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mingle-accent-blue"
              />
              <div className="w-full rounded-[10px] border border-mingle-border bg-mingle-white py-2.5 pl-10 pr-4 text-left text-sm text-mingle-text-secondary">
                {searchLabel}
              </div>
            </div>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2.5 sm:gap-4">
            <span className="hidden rounded-full border border-mingle-border bg-mingle-white px-2.5 py-1 text-[10px] font-medium text-mingle-text-secondary sm:inline">
              Sample workspace
            </span>
            <div
              aria-hidden
              className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-mingle-border bg-mingle-white text-mingle-text-secondary"
            >
              <HelpIcon size={16} />
            </div>
            <div className="flex items-center gap-2.5">
              <Avatar
                photo={isCompany ? null : DEMO_EMMA.photo}
                initials={accountInitials}
                gender={isCompany ? null : DEMO_EMMA.gender}
                size="sm"
                shape={isCompany ? "soft" : "circle"}
              />
              <div className="hidden leading-tight sm:block">
                <p className="text-sm font-semibold text-mingle-text">
                  {accountName}
                </p>
                <p className="text-xs text-mingle-text-secondary">
                  {accountSubtitle}
                </p>
              </div>
            </div>
          </div>
        </header>

        <div
          className={
            fillMain
              ? "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-5 pb-4 pt-5 sm:px-8"
              : "min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-5 pb-8 pt-5 sm:px-8 sm:pt-7"
          }
        >
          {title ? (
            <h1
              className={`shrink-0 font-display font-bold tracking-tight text-mingle-text ${
                fillMain
                  ? "mb-4 text-xl sm:text-2xl"
                  : "mb-6 text-[1.65rem] sm:mb-7 sm:text-[1.85rem]"
              }`}
            >
              {title}
            </h1>
          ) : null}
          {fillMain ? (
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}
