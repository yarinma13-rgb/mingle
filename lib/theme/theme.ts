export const THEME_STORAGE_KEY = "mingle-theme";

export type ThemeName = "light" | "dark";

export function isThemeName(value: unknown): value is ThemeName {
  return value === "light" || value === "dark";
}

export function readStoredTheme(): ThemeName {
  if (typeof window === "undefined") return "light";
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function applyTheme(theme: ThemeName) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Private mode can block storage; the in-memory attribute still works.
  }
}

/** Inline boot script — keep in sync with THEME_STORAGE_KEY. */
export const THEME_BOOTSTRAP = `(function(){try{var t=localStorage.getItem("mingle-theme");document.documentElement.setAttribute("data-theme",t==="dark"?"dark":"light");}catch(e){document.documentElement.setAttribute("data-theme","light");}})();`;
