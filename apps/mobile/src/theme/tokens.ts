export type ThemeName = "light" | "dark";

export const THEME_STORAGE_KEY = "mingle-theme";

// Synced 2026-10-19 with the live web app (app/globals.css, app.mingle.careers):
// same pink / purple / blue, Figtree typeface, lavender page background,
// blue CTA buttons. The earlier navy header came from AI mockups and is gone.
export const brand = {
  pink: "#E94D8A",
  pinkDeep: "#D63A78",
  blue: "#4E73F5",
  purple: "#8B53F5",
  cta: "#4E73F5",
  accentPink: "#E94D8A",
  accentMagenta: "#EB59A8",
  accentPurple: "#8B53F5",
  accentViolet: "#7E57F5",
  accentBlue: "#4E78F4",
  success: "#2F9D6A",
  warning: "#D4A017",
  error: "#C47A5A",
  connection: ["#EB59A8", "#8B53F5", "#4E73F5"] as const,
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
  /** Navy app-bar / hero surface from the approved mockups (both themes). */
  header: string;
  headerText: string;
  /** Solid primary action colour (mockups: deep navy light, indigo dark). */
  primary: string;
  onPrimary: string;
};

export const themes: Record<ThemeName, ThemeColors> = {
  light: {
    background: "#EFF0FC",
    productBg: "#EFF0FC",
    lavender: "#EFE8FE",
    surface: "#FFFFFF",
    surfaceElevated: "#FFFFFF",
    text: "#1C1B2E",
    textSecondary: "#65647E",
    textMuted: "#8B8A9E",
    border: "rgba(28,27,46,0.08)",
    navActiveBg: "#EFE8FE",
    navActive: "#8B53F5",
    navIdle: "#676879",
    navDivider: "rgba(28,27,46,0.08)",
    header: "#FFFFFF",
    headerText: "#1C1B2E",
    primary: "#4E73F5",
    onPrimary: "#FFFFFF",
  },
  dark: {
    background: "#0F1420",
    productBg: "#171D2B",
    lavender: "#1A2233",
    surface: "#202738",
    surfaceElevated: "#202738",
    text: "#F7F8FB",
    textSecondary: "#C9CED8",
    textMuted: "#A8B0C0",
    border: "rgba(255,255,255,0.16)",
    navActiveBg: "rgba(123,47,247,0.18)",
    navActive: "#C4B5FD",
    navIdle: "#9AA3B5",
    navDivider: "rgba(255,255,255,0.10)",
    header: "#171D2B",
    headerText: "#F7F8FB",
    primary: "#4E73F5",
    onPrimary: "#FFFFFF",
  },
};

export function scoreTone(score: number): string {
  if (score >= 70) return brand.success;
  if (score >= 45) return brand.warning;
  return brand.error;
}

