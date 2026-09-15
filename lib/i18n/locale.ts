export type AppLocale = "en" | "he";

export const LOCALE_STORAGE_KEY = "mingle.locale";
/** Legacy landing key — still read so EN/HE choice carries into auth + app. */
export const LEGACY_LANDING_LOCALE_KEY = "mingle.landing.locale";

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return value === "en" || value === "he";
}

export function readStoredLocale(): AppLocale {
  if (typeof window === "undefined") return "en";
  try {
    const primary = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isAppLocale(primary)) return primary;
    const legacy = window.localStorage.getItem(LEGACY_LANDING_LOCALE_KEY);
    if (isAppLocale(legacy)) return legacy;
  } catch {
    /* ignore */
  }
  return "en";
}

export function writeStoredLocale(locale: AppLocale) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    window.localStorage.setItem(LEGACY_LANDING_LOCALE_KEY, locale);
  } catch {
    /* ignore */
  }
}

export function localeDir(locale: AppLocale): "ltr" | "rtl" {
  return locale === "he" ? "rtl" : "ltr";
}
