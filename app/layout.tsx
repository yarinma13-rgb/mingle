import { Suspense } from "react";
import type { Metadata } from "next";
import { Figtree, Plus_Jakarta_Sans, Rubik } from "next/font/google";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { CommandPaletteProvider } from "@/components/command-palette/CommandPaletteProvider";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { THEME_BOOTSTRAP } from "@/lib/theme/theme";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
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
      className={`${figtree.variable} ${plusJakarta.variable} ${rubik.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body className="mingle-app-canvas min-h-full flex flex-col font-sans text-mingle-text">
        <AppErrorBoundary>
          <ThemeProvider>
            <ToastProvider>
              <Suspense fallback={null}>
                <CommandPaletteProvider>{children}</CommandPaletteProvider>
              </Suspense>
            </ToastProvider>
          </ThemeProvider>
        </AppErrorBoundary>
      </body>
    </html>
  );
}
