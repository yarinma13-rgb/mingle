import type { UserType } from "@/lib/supabase/types";

export type CommandItem = {
  id: string;
  label: string;
  href: string;
  keywords: string[];
};

const TALENT_ITEMS: CommandItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    keywords: ["home", "overview"],
  },
  {
    id: "discover",
    label: "Discover",
    href: "/discover",
    keywords: ["companies", "search", "cards"],
  },
  {
    id: "connections",
    label: "Connections",
    href: "/connections",
    keywords: ["requests", "pipeline"],
  },
  {
    id: "conversations",
    label: "Conversations",
    href: "/conversations",
    keywords: ["chat", "messages"],
  },
  {
    id: "saved",
    label: "Saved",
    href: "/saved",
    keywords: ["bookmark", "later"],
  },
  {
    id: "profile",
    label: "My profile",
    href: "/profile/build",
    keywords: ["account", "edit"],
  },
  {
    id: "settings",
    label: "Settings",
    href: "/settings",
    keywords: ["account", "sign out", "logout"],
  },
  {
    id: "plans",
    label: "See plans",
    href: "/coming-soon",
    keywords: ["billing", "upgrade", "soon"],
  },
];

const COMPANY_ITEMS: CommandItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    keywords: ["home", "overview"],
  },
  {
    id: "roles",
    label: "Roles",
    href: "/roles",
    keywords: ["jobs", "hiring", "open"],
  },
  {
    id: "candidates",
    label: "Candidates",
    href: "/discover",
    keywords: ["discover", "talent", "search"],
  },
  {
    id: "pipeline",
    label: "Pipeline",
    href: "/connections",
    keywords: ["connections", "requests"],
  },
  {
    id: "conversations",
    label: "Conversations",
    href: "/conversations",
    keywords: ["chat", "messages"],
  },
  {
    id: "board",
    label: "Board",
    href: "/board",
    keywords: ["kanban", "stages", "columns"],
  },
  {
    id: "interviews",
    label: "Interviews",
    href: "/interviews",
    keywords: ["calendar", "schedule"],
  },
  {
    id: "team",
    label: "Team",
    href: "/team",
    keywords: ["members", "invite"],
  },
  {
    id: "profile",
    label: "My profile",
    href: "/company-profile/build",
    keywords: ["company", "account", "edit"],
  },
  {
    id: "settings",
    label: "Settings",
    href: "/settings",
    keywords: ["account", "sign out", "logout"],
  },
  {
    id: "plans",
    label: "See plans",
    href: "/coming-soon",
    keywords: ["billing", "upgrade", "soon"],
  },
];

export function commandItemsFor(userType: UserType): CommandItem[] {
  return userType === "company" ? COMPANY_ITEMS : TALENT_ITEMS;
}

export function filterCommandItems(
  items: CommandItem[],
  query: string,
): CommandItem[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return items;
  return items.filter((item) => {
    if (item.label.toLowerCase().includes(needle)) return true;
    return item.keywords.some((word) => word.includes(needle));
  });
}

const ENABLED_PREFIXES = [
  "/dashboard",
  "/discover",
  "/connections",
  "/conversations",
  "/board",
  "/profile",
  "/company-profile",
  "/settings",
  "/roles",
  "/interviews",
  "/team",
  "/saved",
  "/coming-soon",
];

export function isCommandPalettePath(pathname: string): boolean {
  return ENABLED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
