import { Suspense } from "react";
import type { Metadata } from "next";
import { DemoShell } from "@/components/DemoShell";

export const metadata: Metadata = {
  title: "Product demo | mingle",
  description:
    "A short, recording-ready walkthrough of the mingle product — company hiring, talent profiles, relevance, and conversation.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DemoPage() {
  return (
    <main className="demo-page flex h-[100dvh] min-h-[100dvh] flex-1 flex-col overflow-hidden bg-mingle-surface">
      <Suspense
        fallback={
          <div className="flex min-h-screen flex-1 items-center justify-center text-sm text-mingle-text-secondary">
            Loading demo…
          </div>
        }
      >
        <DemoShell />
      </Suspense>
    </main>
  );
}
