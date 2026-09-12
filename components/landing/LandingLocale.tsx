"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
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

function readStoredLocale(): LandingLocale {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "he" || stored === "en") return stored;
  } catch {
    /* ignore */
  }
  return "en";
}

export function LandingLocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LandingLocale>("en");

  useEffect(() => {
    setLocaleState(readStoredLocale());
  }, []);

  const setLocale = useCallback((next: LandingLocale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
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
        onClick={() => setLocale("en")}
      >
        {t.lang.en}
      </button>
      <button
        type="button"
        className={locale === "he" ? "is-active" : undefined}
        aria-pressed={locale === "he"}
        aria-label="עברית"
        onClick={() => setLocale("he")}
      >
        {t.lang.he}
      </button>
    </div>
  );
}
