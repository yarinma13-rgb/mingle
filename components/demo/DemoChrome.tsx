"use client";

import { MingleLogo } from "@/components/MingleLogo";
import { Avatar } from "@/components/Avatar";
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
} from "@/components/dashboard/icons";
import { DEMO_COMPANY } from "@/lib/demo/data";

const NAV = [
  { label: "Dashboard", icon: GridIcon },
  { label: "Roles", icon: BriefcaseIcon },
  { label: "Candidates", icon: PeopleIcon },
  { label: "Conversations", icon: MessageIcon },
  { label: "Pipeline", icon: FunnelIcon },
  { label: "Board", icon: ColumnsIcon },
  { label: "Interviews", icon: CalendarIcon },
  { label: "My profile", icon: UserIcon },
  { label: "Settings", icon: GearIcon },
] as const;

/**
 * Visual twin of DashboardShell for recording — no live routing, no
 * auth, no destructive actions. Clicks only notify the parent so the
 * demo story can advance without leaving /demo.
 */
export function DemoChrome({
  activeNav,
  title,
  children,
  onNavSelect,
}: {
  activeNav: string;
  title: string;
  children: React.ReactNode;
  onNavSelect?: (label: string) => void;
}) {
  return (
    <div className="demo-chrome flex h-full min-h-0 w-full overflow-hidden rounded-2xl border border-mingle-border bg-mingle-product shadow-mingle">
      <aside className="hidden w-[220px] shrink-0 flex-col border-r border-mingle-nav-divider bg-mingle-sidebar px-3 py-4 lg:flex">
        <div className="mb-5 flex items-center gap-2.5 px-2">
          <MingleLogo size={28} priority />
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-semibold tracking-tight text-mingle-text">
              mingle
            </p>
            <p className="truncate text-[10px] text-mingle-text-secondary">
              {DEMO_COMPANY.name}
            </p>
          </div>
        </div>

        <nav aria-label="Demo navigation" className="flex flex-1 flex-col gap-0.5">
          {NAV.map((item) => {
            const active = item.label === activeNav;
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => onNavSelect?.(item.label)}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-colors ${
                  active
                    ? "bg-mingle-nav-active-bg text-mingle-nav-active"
                    : "text-mingle-nav-idle hover:bg-mingle-nav-hover-bg hover:text-mingle-nav-active"
                }`}
              >
                <Icon size={16} className="shrink-0 opacity-80" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-mingle-border/70 bg-mingle-bg/60 px-2.5 py-2">
          <Avatar initials={DEMO_COMPANY.initials} size="sm" shape="soft" />
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-mingle-text">
              {DEMO_COMPANY.name}
            </p>
            <p className="truncate text-[10px] text-mingle-text-secondary">
              Hiring workspace
            </p>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-mingle-border bg-mingle-surface/90 px-4 py-3 backdrop-blur sm:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mingle-text-muted">
              {DEMO_COMPANY.name}
            </p>
            <h1 className="truncate font-display text-base font-semibold tracking-tight text-mingle-text sm:text-lg">
              {title}
            </h1>
          </div>
          <span className="shrink-0 rounded-full border border-mingle-border bg-mingle-bg px-2.5 py-1 text-[10px] font-medium text-mingle-text-secondary">
            Sample workspace
          </span>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-mingle-product p-4 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
