"use client";

import { AnimatePresence, motion } from "framer-motion";
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
import {
  demoChromeShellTransition,
  demoContentVariants,
  demoEase,
} from "@/lib/demo/motion";
import { useDemoPlayback } from "@/lib/demo/playback-context";
import { typeProgress } from "@/lib/demo/typewriter";

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
 * Persistent product chrome — stays mounted across product scenes so only
 * the main canvas morphs (monday-like continuity).
 */
export function DemoChrome({
  activeNav,
  title,
  audience = "company",
  contentKey,
  children,
  onNavSelect,
  fillMain = false,
  reducedMotion = false,
}: {
  activeNav: string;
  title: string;
  audience?: DemoAudience;
  /** Changes when scene content should crossfade. */
  contentKey: string;
  children: React.ReactNode;
  onNavSelect?: (label: string) => void;
  fillMain?: boolean;
  reducedMotion?: boolean;
}) {
  const { sceneId, elapsedMs, playing, reducedMotion: motionPref } =
    useDemoPlayback();
  const preferReduced = reducedMotion || motionPref;
  const nav = audience === "talent" ? TALENT_NAV : COMPANY_NAV;
  const isCompany = audience === "company";
  const accountName = isCompany ? DEMO_COMPANY.name : DEMO_EMMA.name;
  const accountInitials = isCompany ? DEMO_COMPANY.initials : DEMO_EMMA.initials;
  const accountSubtitle = isCompany ? "Hiring workspace" : DEMO_EMMA.headline;
  const searchPlaceholder = isCompany
    ? "Search candidates"
    : "Search companies";
  const searchTyped =
    sceneId === "introduce" && playing
      ? preferReduced
        ? elapsedMs >= 3000
          ? "Emma Carter"
          : ""
        : typeProgress("Emma Carter", 3000, elapsedMs, 26)
      : "";
  const searchActive = Boolean(searchTyped);

  return (
    <motion.div
      transition={demoChromeShellTransition}
      className="demo-chrome flex h-full min-h-0 w-full overflow-hidden bg-mingle-surface"
    >
      <aside className="mingle-app-sidebar hidden w-[6.25rem] shrink-0 flex-col items-center self-stretch overflow-y-auto border-r border-mingle-nav-divider/80 bg-mingle-sidebar px-2 md:flex">
        <div className="flex h-[4.75rem] w-full shrink-0 items-center justify-center pt-1">
          <MingleLogo variant="mark" size={41} priority />
        </div>
        <div className="flex w-full flex-1 flex-col items-center gap-0.5 pb-5 pt-2">
          <nav aria-label="Demo navigation" className="flex w-full flex-col items-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={audience}
                initial={preferReduced ? false : { opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={preferReduced ? undefined : { opacity: 0, x: 6 }}
                transition={{ duration: 0.35, ease: demoEase }}
                className="flex w-full flex-col items-center"
              >
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
                          className={`relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300 ${
                            active
                              ? "bg-mingle-nav-active-bg shadow-[inset_0_0_0_1px_rgba(0,115,234,0.08)]"
                              : "bg-transparent group-hover:bg-mingle-nav-hover-bg"
                          }`}
                        >
                          {active ? (
                            <motion.span
                              layoutId="demo-nav-glow"
                              className="absolute inset-0 rounded-xl bg-gradient-to-b from-mingle-accent-blue/10 to-transparent"
                              transition={{ duration: 0.35, ease: demoEase }}
                            />
                          ) : null}
                          <Icon
                            size={18}
                            className={
                              active
                                ? "relative text-mingle-nav-active"
                                : "relative text-mingle-nav-idle group-hover:text-mingle-nav-active"
                            }
                          />
                        </span>
                        <span
                          className={`max-w-[5.25rem] px-0.5 text-center text-[10px] font-medium leading-snug transition-colors duration-300 ${
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
              </motion.div>
            </AnimatePresence>
          </nav>
          <div
            data-demo-target="theme-toggle"
            className="mt-auto flex w-full flex-col items-center pb-2 pt-6"
          >
            <ThemeSwitch />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-transparent">
        <header className="relative z-30 flex min-h-[4.25rem] w-full shrink-0 items-center gap-3 border-b border-mingle-border/60 bg-mingle-surface/50 px-4 pb-2 pt-2 backdrop-blur-sm sm:min-h-[4.75rem] sm:gap-6 sm:px-6 sm:pb-0">
          <div className="shrink-0 md:hidden">
            <MingleLogo variant="mark" size={34} priority />
          </div>

          <div className="hidden flex-1 justify-center md:flex">
            <div className="relative w-full max-w-md" data-demo-target="search-field">
              <SearchIcon
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mingle-accent-blue"
              />
              <div
                className={`w-full rounded-[10px] border bg-mingle-white py-2.5 pl-10 pr-4 text-left text-sm shadow-[0_1px_0_rgba(255,255,255,0.8)] transition-colors duration-300 ${
                  searchActive
                    ? "border-mingle-accent-blue/45 text-mingle-text shadow-[0_0_0_3px_rgba(62,107,224,0.08)]"
                    : "border-mingle-border text-mingle-text-secondary"
                }`}
              >
                {searchActive ? (
                  <span className="demo-typed-line">
                    {searchTyped}
                    {playing &&
                    searchTyped.length < "Emma Carter".length &&
                    !preferReduced ? (
                      <span className="demo-caret" aria-hidden />
                    ) : null}
                  </span>
                ) : (
                  searchPlaceholder
                )}
              </div>
            </div>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2.5 sm:gap-4">
            <span className="hidden rounded-full border border-mingle-border bg-mingle-white/90 px-2.5 py-1 text-[10px] font-medium text-mingle-text-secondary sm:inline">
              Sample workspace
            </span>
            <div
              aria-hidden
              className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-mingle-border bg-mingle-white text-mingle-text-secondary"
            >
              <HelpIcon size={16} />
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={accountName}
                initial={preferReduced ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={preferReduced ? undefined : { opacity: 0, y: -4 }}
                transition={{ duration: 0.3, ease: demoEase }}
                className="flex items-center gap-2.5"
              >
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
              </motion.div>
            </AnimatePresence>
          </div>
        </header>

        <div
          className={
            fillMain
              ? "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-5 pb-4 pt-5 sm:px-8"
              : "min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-5 pb-8 pt-5 sm:px-8 sm:pt-7"
          }
        >
          <AnimatePresence mode="wait">
            <motion.h1
              key={title}
              initial={preferReduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={preferReduced ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: demoEase }}
              className={`shrink-0 font-display font-bold tracking-tight text-mingle-text ${
                fillMain
                  ? "mb-4 text-xl sm:text-2xl"
                  : "mb-6 text-[1.65rem] sm:mb-7 sm:text-[1.85rem]"
              }`}
            >
              {title}
            </motion.h1>
          </AnimatePresence>

          <div className={fillMain ? "relative flex min-h-0 min-w-0 flex-1 flex-col" : "relative"}>
            <AnimatePresence mode="wait">
              <motion.div
                key={contentKey}
                variants={preferReduced ? undefined : demoContentVariants}
                initial={preferReduced ? false : "initial"}
                animate="animate"
                exit={preferReduced ? undefined : "exit"}
                className={fillMain ? "flex min-h-0 flex-1 flex-col" : undefined}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
