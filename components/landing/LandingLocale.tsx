"use client";

import { AnalyticsEvent } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";

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
  LANDING_COPY,
  type LandingCopy,
  type LandingLocale,
} from "@/lib/landing/copy";
import {
  hydrateAppLocaleFromStorage,
  useAppLocaleOptional,
} from "@/components/i18n/AppLocaleProvider";
import {
  readStoredLocale,
  writeStoredLocale,
  type AppLocale,
} from "@/lib/i18n/locale";

type LandingLocaleContextValue = {
  locale: LandingLocale;
  setLocale: (locale: LandingLocale) => void;
  t: LandingCopy;
};

const LandingLocaleContext = createContext<LandingLocaleContextValue | null>(
  null,
);

const listeners = new Set<() => void>();
let memoryLocale: LandingLocale = "en";

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

function getServerSnapshot(): LandingLocale {
  return "en";
}

function writeLocale(next: LandingLocale) {
  memoryLocale = next;
  writeStoredLocale(next as AppLocale);
  if (typeof document !== "undefined") {
    document.documentElement.lang = next;
    document.documentElement.dir = next === "he" ? "rtl" : "ltr";
  }
  emit();
}

export function LandingLocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    hydrateAppLocaleFromStorage();
    const stored = readStoredLocale();
    if (stored !== memoryLocale) {
      memoryLocale = stored;
      emit();
    }
  }, []);

  const setLocale = useCallback((next: LandingLocale) => {
    writeLocale(next);
  }, []);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: LANDING_COPY[locale],
    }),
    [locale, setLocale],
  );

  return (
    <LandingLocaleContext.Provider value={value}>
      {children}
    </LandingLocaleContext.Provider>
  );
}

export function useLandingLocale() {
  const ctx = useContext(LandingLocaleContext);
  if (!ctx) {
    throw new Error("useLandingLocale must be used within LandingLocaleProvider");
  }
  return ctx;
}

export function LandingLanguageSwitch() {
  const { locale, setLocale, t } = useLandingLocale();
  // Keep app provider in sync when both trees mount.
  const app = useAppLocaleOptional();

  return (
    <div className="landing-lang" role="group" aria-label={t.lang.aria}>
      <button
        type="button"
        className={locale === "en" ? "is-active" : undefined}
        aria-pressed={locale === "en"}
        aria-label="English"
        onClick={() => {
          track(AnalyticsEvent.landingLocaleChanged, { locale: "en" });
          setLocale("en");
          app.setLocale("en");
        }}
      >
        {t.lang.en}
      </button>
      <button
        type="button"
        className={locale === "he" ? "is-active" : undefined}
        aria-pressed={locale === "he"}
        aria-label="עברית"
        onClick={() => {
          track(AnalyticsEvent.landingLocaleChanged, { locale: "he" });
          setLocale("he");
          app.setLocale("he");
        }}
      >
        {t.lang.he}
      </button>
    </div>
  );
}
