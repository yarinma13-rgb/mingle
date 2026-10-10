"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { UserType } from "@/lib/supabase/types";
import {
  commandItemsFor,
  filterCommandItems,
  isCommandPalettePath,
  type CommandItem,
} from "@/lib/command-palette/items";
import {
  searchCompanyCommandItems,
  searchTalentCommandItems,
} from "@/lib/command-palette/search";
import { SearchIcon } from "@/components/dashboard/icons";

type CommandPaletteContextValue = {
  enabled: boolean;
  openPalette: () => void;
};

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(
  null,
);

const subscribeNoop = () => () => {};

const RECENT_SEARCHES_KEY = "mingle.cmdk.recent";
const RECENT_SEARCHES_LIMIT = 5;

type RecentSearch = { id: string; label: string; href: string };

function readRecentSearches(): RecentSearch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentSearch[];
    return Array.isArray(parsed) ? parsed.slice(0, RECENT_SEARCHES_LIMIT) : [];
  } catch {
    return [];
  }
}

function pushRecentSearch(item: Pick<CommandItem, "id" | "label" | "href">) {
  if (typeof window === "undefined") return;
  try {
    const id = item.id.startsWith("recent:") ? item.id.slice(7) : item.id;
    const next = [
      { id, label: item.label, href: item.href },
      ...readRecentSearches().filter((row) => row.id !== id),
    ].slice(0, RECENT_SEARCHES_LIMIT);
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / private mode */
  }
}


export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) {
    throw new Error("useCommandPalette must be used within CommandPaletteProvider");
  }
  return ctx;
}

export function CommandPaletteProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const enabled = isCommandPalettePath(pathname);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [entityResult, setEntityResult] = useState<{
    needle: string;
    items: CommandItem[];
  }>({ needle: "", items: [] });
  const [recent, setRecent] = useState<RecentSearch[]>([]);

  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const open = enabled && sessionOpen;
  const needle = query.trim();
  const shouldSearchEntities =
    open &&
    (userType === "company" || userType === "talent") &&
    needle.length >= 2;
  const searching =
    shouldSearchEntities && entityResult.needle !== needle;

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let cancelled = false;
    const supabase = createClient();
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { data } = await supabase
        .from("users")
        .select("user_type")
        .eq("id", user.id)
        .maybeSingle();
      if (
        !cancelled &&
        (data?.user_type === "talent" || data?.user_type === "company")
      ) {
        setUserType(data.user_type);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => {
    if (!shouldSearchEntities || !userType) return;
    let cancelled = false;
    const handle = window.setTimeout(() => {
      const search =
        userType === "talent"
          ? searchTalentCommandItems
          : searchCompanyCommandItems;
      void search(needle).then((rows) => {
        if (cancelled) return;
        setEntityResult({ needle, items: rows });
      });
    }, 180);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [shouldSearchEntities, needle, userType]);

  const items = useMemo(() => {
    const nav = userType
      ? filterCommandItems(commandItemsFor(userType), query)
      : [];
    if (!needle && recent.length > 0) {
      const recentItems: CommandItem[] = recent.map((row) => ({
        id: `recent:${row.id}`,
        label: row.label,
        href: row.href,
        keywords: ["recent"],
      }));
      const seen = new Set(recentItems.map((item) => item.href));
      return [...recentItems, ...nav.filter((item) => !seen.has(item.href))];
    }
    if (!shouldSearchEntities) return nav;
    const entityItems =
      entityResult.needle === needle ? entityResult.items : [];
    const seen = new Set(nav.map((item) => item.id));
    const extras = entityItems.filter((item) => !seen.has(item.id));
    return [...extras, ...nav];
  }, [userType, query, shouldSearchEntities, entityResult, needle, recent]);

  useEffect(() => {
    const node = listRef.current?.querySelector("[data-active=true]");
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, items]);

  const close = useCallback(() => {
    setSessionOpen(false);
    setQuery("");
    setActiveIndex(0);
    setEntityResult({ needle: "", items: [] });
  }, []);

  const openPalette = useCallback(() => {
    if (!enabled || !userType) return;
    setQuery("");
    setActiveIndex(0);
    setEntityResult({ needle: "", items: [] });
    setRecent(readRecentSearches());
    setSessionOpen(true);
  }, [enabled, userType]);

  const runItem = useCallback(
    (item: CommandItem | RecentSearch) => {
      pushRecentSearch(item);
      setRecent(readRecentSearches());
      close();
      router.push(item.href);
    },
    [close, router],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey) && !event.altKey) {
        if (!enabled || !userType) return;
        event.preventDefault();
        setSessionOpen((wasOpen) => {
          if (wasOpen) {
            setQuery("");
            return false;
          }
          setQuery("");
          setActiveIndex(0);
          setRecent(readRecentSearches());
          return true;
        });
        return;
      }
      if (!open) return;
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((index) =>
          items.length === 0 ? 0 : (index + 1) % items.length,
        );
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((index) =>
          items.length === 0 ? 0 : (index - 1 + items.length) % items.length,
        );
        return;
      }
      if (event.key === "Enter") {
        const item = items[activeIndex];
        if (!item) return;
        event.preventDefault();
        runItem(item);
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [enabled, userType, open, items, activeIndex, close, runItem]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const id = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      document.body.style.overflow = previous;
      window.cancelAnimationFrame(id);
    };
  }, [open]);

  const value = useMemo(
    () => ({ enabled: enabled && userType !== null, openPalette }),
    [enabled, userType, openPalette],
  );

  const shortcutHint =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad/i.test(navigator.platform)
      ? "⌘K"
      : "Ctrl+K";

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      {mounted
        ? createPortal(
            <AnimatePresence>
              {open ? (
                <motion.div
                  key="command-palette"
                  className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[min(18vh,8rem)]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                >
                  <button
                    type="button"
                    aria-label="Close command palette"
                    className="absolute inset-0 bg-black/55"
                    onClick={close}
                  />
                  <motion.div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Jump to a screen"
                    initial={
                      reduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: 10, scale: 0.98 }
                    }
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-mingle-border bg-mingle-white shadow-mingle"
                    transition={{
                      duration: reduceMotion ? 0.12 : 0.18,
                      ease: "easeOut",
                    }}
                  >
                    <div className="flex items-center gap-3 border-b border-mingle-border px-4 py-3">
                      <SearchIcon
                        size={16}
                        className="shrink-0 text-mingle-text-secondary"
                      />
                      <input
                        ref={inputRef}
                        value={query}
                        onChange={(event) => {
                          setQuery(event.target.value);
                          setActiveIndex(0);
                        }}
                        placeholder={
                          userType === "company"
                            ? "Search candidates, roles, or jump…"
                            : "Search or jump to a screen"
                        }
                        aria-autocomplete="list"
                        aria-controls="command-palette-list"
                        aria-activedescendant={
                          items[activeIndex]
                            ? `command-item-${items[activeIndex].id}`
                            : undefined
                        }
                        className="min-w-0 flex-1 bg-transparent text-sm text-mingle-text placeholder:text-mingle-muted focus:outline-none"
                      />
                      <kbd className="hidden rounded-md border border-mingle-border px-1.5 py-0.5 font-sans text-[10px] font-medium text-mingle-text-secondary sm:inline">
                        {shortcutHint}
                      </kbd>
                    </div>
                    <div
                      id="command-palette-list"
                      ref={listRef}
                      role="listbox"
                      aria-label="Screens"
                      className="max-h-72 overflow-y-auto p-2"
                    >
                      {items.length === 0 ? (
                        <p className="px-3 py-8 text-center text-sm text-mingle-text-secondary">
                          {searching
                            ? "Searching…"
                            : "Nothing matches that."}
                        </p>
                      ) : (
                        items.map((item, index) => {
                          const active = index === activeIndex;
                          return (
                            <button
                              key={item.id}
                              id={`command-item-${item.id}`}
                              type="button"
                              role="option"
                              aria-selected={active}
                              data-active={active}
                              onMouseEnter={() => setActiveIndex(index)}
                              onClick={() => runItem(item)}
                              className={`flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                                active
                                  ? "bg-mingle-lavender text-mingle-text"
                                  : "text-mingle-text-secondary hover:bg-mingle-lavender hover:text-mingle-text"
                              }`}
                            >
                              {item.id.startsWith("recent:") ? `Recent · ${item.label}` : item.label}
                            </button>
                          );
                        })
                      )}
                    </div>
                    <p className="border-t border-mingle-border px-4 py-2 text-[11px] text-mingle-text-secondary">
                      Use arrows to move, Enter to open, Escape to close.
                    </p>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </CommandPaletteContext.Provider>
  );
}
