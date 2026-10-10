import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useColorScheme as useSystemScheme } from "react-native";
import {
  THEME_STORAGE_KEY,
  themes,
  type ThemeColors,
  type ThemeName,
} from "@/src/theme/tokens";

type ThemeContextValue = {
  theme: ThemeName;
  colors: ThemeColors;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useSystemScheme();
  const [theme, setThemeState] = useState<ThemeName>("light");
  useEffect(() => {
    let alive = true;
    (async () => {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (!alive) return;
      if (stored === "dark" || stored === "light") setThemeState(stored);
      else if (system === "dark") setThemeState("dark");
    })();
    return () => {
      alive = false;
    };
  }, [system]);

  const setTheme = useCallback((next: ThemeName) => {
    setThemeState(next);
    void AsyncStorage.setItem(THEME_STORAGE_KEY, next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  const value = useMemo(
    () => ({ theme, colors: themes[theme], setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  // Always provide a theme — never blank the tree (white screen on web).
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
