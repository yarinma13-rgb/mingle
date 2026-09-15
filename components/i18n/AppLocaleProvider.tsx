"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  localeDir,
  readStoredLocale,
  writeStoredLocale,
  type AppLocale,
} from "@/lib/i18n/locale";
import { messagesFor, type AppMessages } from "@/lib/i18n/messages";
import { AnalyticsEvent } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";

type AppLocaleContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: AppMessages;
  dir: "ltr" | "rtl";
};

const AppLocaleContext = createContext<AppLocaleContextValue | null>(null);

const listeners = new Set<() => void>();
let memoryLocale: AppLocale = "en";

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

function getSnapshot() {
  return memoryLocale;
}

function getServerSnapshot(): AppLocale {
  return "en";
}

function writeLocale(next: AppLocale) {
  memoryLocale = next;
  writeStoredLocale(next);
  if (typeof document !== "undefined") {
    document.documentElement.lang = next;
    document.documentElement.dir = localeDir(next);
  }
  emit();
}

/** Call once from any hydrated client tree — keeps landing + app in sync. */
export function hydrateAppLocaleFromStorage() {
  const stored = readStoredLocale();
  if (stored !== memoryLocale) {
    writeLocale(stored);
  }
}

export function AppLocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    hydrateAppLocaleFromStorage();
  }, []);

  const setLocale = useCallback((next: AppLocale) => {
    writeLocale(next);
  }, []);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: messagesFor(locale),
      dir: localeDir(locale),
    }),
    [locale, setLocale],
  );

  return (
    <AppLocaleContext.Provider value={value}>{children}</AppLocaleContext.Provider>
  );
}

export function useAppLocale() {
  const ctx = useContext(AppLocaleContext);
  if (!ctx) {
    throw new Error("useAppLocale must be used within AppLocaleProvider");
  }
  return ctx;
}

/** Safe for trees that may render outside the provider (falls back to EN). */
export function useAppLocaleOptional(): AppLocaleContextValue {
  const ctx = useContext(AppLocaleContext);
  if (ctx) return ctx;
  return {
    locale: "en",
    setLocale: () => undefined,
    t: messagesFor("en"),
    dir: "ltr",
  };
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18" />
      <path d="M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}

/**
 * Globe language control — toggles EN ↔ HE (same preference as landing).
 */
export function LocaleGlobeButton({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { locale, setLocale, t } = useAppLocale();
  const next: AppLocale = locale === "he" ? "en" : "he";

  return (
    <button
      type="button"
      aria-label={t.lang.aria}
      title={`${t.lang.aria}: ${locale === "he" ? t.lang.en : t.lang.he}`}
      onClick={() => {
        track(AnalyticsEvent.landingLocaleChanged, { locale: next, source: "globe" });
        setLocale(next);
      }}
      className={`inline-flex items-center gap-1.5 rounded-full border border-mingle-border bg-mingle-white text-mingle-text-secondary transition-colors hover:border-mingle-blue hover:text-mingle-text ${
        compact ? "h-9 w-9 justify-center" : "h-9 px-3 text-xs font-semibold"
      } ${className}`}
    >
      <GlobeIcon className="h-4 w-4 shrink-0" />
      {compact ? null : (
        <span aria-hidden>{locale === "he" ? t.lang.he : t.lang.en}</span>
      )}
    </button>
  );
}
