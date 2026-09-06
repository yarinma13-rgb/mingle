import { Suspense } from "react";
import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { CommandPaletteProvider } from "@/components/command-palette/CommandPaletteProvider";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "mingle — Careers start with connection",
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
      className={`${figtree.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-mingle-bg font-sans text-mingle-text">
        <AppErrorBoundary>
          <ToastProvider>
            <Suspense fallback={null}>
              <CommandPaletteProvider>{children}</CommandPaletteProvider>
            </Suspense>
          </ToastProvider>
        </AppErrorBoundary>
      </body>
    </html>
  );
}
