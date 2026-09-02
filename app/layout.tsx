import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
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
      className={`${poppins.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-mingle-bg text-mingle-white">
        <AppErrorBoundary>
          <ToastProvider>{children}</ToastProvider>
        </AppErrorBoundary>
      </body>
    </html>
  );
}
