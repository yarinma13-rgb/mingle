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

const STORAGE_KEY = "mingle.landing.locale";

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

function readStoredLocale(): LandingLocale {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "he" || stored === "en") return stored;
  } catch {
    /* ignore */
  }
  return "en";
}

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
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* ignore */
  }
  emit();
}

export function LandingLocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  // Hydrate from localStorage after mount (avoids SSR mismatch).
  useEffect(() => {
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
        }}
      >
        {t.lang.he}
      </button>
    </div>
  );
}
