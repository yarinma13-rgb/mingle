"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import {
  applyTheme,
  readStoredTheme,
  type ThemeName,
} from "@/lib/theme/theme";

type ThemeContextValue = {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getClientTheme(): ThemeName {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "dark" || attr === "light") return attr;
  return readStoredTheme();
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("mingle-theme-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("mingle-theme-change", callback);
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(
    subscribe,
    getClientTheme,
    () => "light" as const,
  );

  const setTheme = useCallback((next: ThemeName) => {
    applyTheme(next);
    window.dispatchEvent(new Event("mingle-theme-change"));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
