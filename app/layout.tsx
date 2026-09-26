import { Suspense } from "react";
import type { Metadata } from "next";
import { Figtree, Rubik } from "next/font/google";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { CommandPaletteProvider } from "@/components/command-palette/CommandPaletteProvider";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { IdentifySession } from "@/components/analytics/IdentifySession";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AppLocaleProvider } from "@/components/i18n/AppLocaleProvider";
import { THEME_BOOTSTRAP } from "@/lib/theme/theme";
import "./globals.css";

/* Figtree is mingle's product typeface; Rubik covers Hebrew. */
const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin", "hebrew"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "mingle | Worth Talking To",
  description:
    "mingle is the career relationship platform that connects talent and companies before a hiring decision is made.",
  manifest: "/manifest.webmanifest",
  applicationName: "mingle",
  appleWebApp: {
    capable: true,
    title: "mingle",
    statusBarStyle: "default",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-theme="light"
      className={`${figtree.variable} ${rubik.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body className="mingle-app-canvas min-h-full flex flex-col font-sans text-mingle-text">
        <AppErrorBoundary>
          <IdentifySession />
          <ThemeProvider>
            <AppLocaleProvider>
              <ToastProvider>
                <Suspense fallback={null}>
                  <CommandPaletteProvider>{children}</CommandPaletteProvider>
                </Suspense>
              </ToastProvider>
            </AppLocaleProvider>
          </ThemeProvider>
        </AppErrorBoundary>
      </body>
    </html>
  );
}
