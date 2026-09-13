export type ThemeName = "light" | "dark";

export const THEME_STORAGE_KEY = "mingle-theme";

export const brand = {
  pink: "#F65F7C",
  pinkDeep: "#D83A52",
  blue: "#0073EA",
  purple: "#9D5CF2",
  cta: "#0073EA",
  accentPink: "#EA1E63",
  accentMagenta: "#C42A9B",
  accentPurple: "#7B2FF7",
  accentViolet: "#5548E8",
  accentBlue: "#3E6BE0",
  success: "#00CA72",
  warning: "#FFCC00",
  error: "#D83A52",
  connection: ["#EA1E63", "#7B2FF7", "#3E6BE0"] as const,
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
    background: "#F7F8FC",
    productBg: "#EEF4FB",
    lavender: "#EEF4FB",
    surface: "#FFFFFF",
    surfaceElevated: "#FFFFFF",
    text: "#252238",
    textSecondary: "#77738A",
    textMuted: "#A5A1B3",
    border: "#D9E4F2",
    navActiveBg: "#ECEFF5",
    navActive: "#323338",
    navIdle: "#676879",
    navDivider: "#E6E9EF",
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

