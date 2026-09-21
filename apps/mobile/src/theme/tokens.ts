export type ThemeName = "light" | "dark";

export const THEME_STORAGE_KEY = "mingle-theme";

/** Final brand primary palette (web + mobile, 20.9 decision). */
export const brand = {
  pink: "#EA1E63",
  pinkDeep: "#D01856",
  blue: "#3E6BE0",
  purple: "#7B2FF7",
  cta: "#3E6BE0",
  accentPink: "#EA1E63",
  accentMagenta: "#C42A9B",
  accentPurple: "#7B2FF7",
  accentViolet: "#5548E8",
  accentBlue: "#3E6BE0",
  success: "#00CA72",
  warning: "#E8A54B",
  error: "#D01856",
  connection: ["#EA1E63", "#7B2FF7", "#3E6BE0"] as const,
  lightPink: "#FDEAF1",
  lightPurple: "#F1E8FE",
  lightBlue: "#E9EFFE",
  productBg: "#F4F1FA",
  text: "#1C1B2E",
  textSecondary: "#65647E",
} as const;

export type ThemeColors = {
  background: string;
  productBg: string;
  lavender: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  navActiveBg: string;
  navActive: string;
  navIdle: string;
  navDivider: string;
};

export const themes: Record<ThemeName, ThemeColors> = {
  light: {
    background: "#FFFFFF",
    productBg: "#F4F1FA",
    lavender: "#F1E8FE",
    surface: "#FFFFFF",
    surfaceElevated: "#FFFFFF",
    text: "#1C1B2E",
    textSecondary: "#65647E",
    textMuted: "#8B8AA3",
    border: "rgba(28,27,46,0.08)",
    navActiveBg: "#F1E8FE",
    navActive: "#1C1B2E",
    navIdle: "#65647E",
    navDivider: "rgba(28,27,46,0.08)",
  },
  dark: {
    background: "#0F1420",
    productBg: "#171D2B",
    lavender: "#1A2233",
    surface: "#202738",
    surfaceElevated: "#2A3348",
    text: "#F3F5F9",
    textSecondary: "#E1E4EA",
    textMuted: "#9AA3B5",
    border: "rgba(255,255,255,0.10)",
    navActiveBg: "rgba(255,255,255,0.10)",
    navActive: "#F3F5F9",
    navIdle: "#9AA3B5",
    navDivider: "rgba(255,255,255,0.10)",
  },
};

export function scoreTone(score: number): string {
  if (score >= 70) return brand.success;
  if (score >= 45) return brand.warning;
  return brand.error;
}
