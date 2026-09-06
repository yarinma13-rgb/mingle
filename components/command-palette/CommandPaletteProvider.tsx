"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
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
} from "@/lib/command-palette/items";
import { SearchIcon } from "@/components/dashboard/icons";

type CommandPaletteContextValue = {
  enabled: boolean;
  openPalette: () => void;
};

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(
  null,
);

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
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setOpen(false);
      setUserType(null);
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
  }, [enabled, pathname]);

  const items = useMemo(
    () => (userType ? filterCommandItems(commandItemsFor(userType), query) : []),
    [userType, query],
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  useEffect(() => {
    const node = listRef.current?.querySelector("[data-active=true]");
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, items]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  const openPalette = useCallback(() => {
    if (!enabled || !userType) return;
    setQuery("");
    setActiveIndex(0);
    setOpen(true);
  }, [enabled, userType]);

  const runItem = useCallback(
    (href: string) => {
      close();
      router.push(href);
    },
    [close, router],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey) && !event.altKey) {
        if (!enabled || !userType) return;
        event.preventDefault();
        setOpen((wasOpen) => {
          if (wasOpen) {
            setQuery("");
            return false;
          }
          setQuery("");
          setActiveIndex(0);
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
        runItem(item.href);
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
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search or jump to a screen"
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
                          Nothing matches that.
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
                              onClick={() => runItem(item.href)}
                              className={`flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                                active
                                  ? "bg-mingle-lavender text-mingle-text"
                                  : "text-mingle-text-secondary hover:bg-mingle-lavender hover:text-mingle-text"
                              }`}
                            >
                              {item.label}
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
