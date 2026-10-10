import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DemoShell } from "@/components/DemoShell";
import { isDemoRouteEnabled } from "@/lib/demo/access";

export const metadata: Metadata = {
  title: "Product demo | mingle",
  description:
    "Private ~3min cinematic product film of mingle — no captions. Talent + Company → Mutual Matching → Understand Why → Better Conversation.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DemoPage() {
  if (!isDemoRouteEnabled()) notFound();

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
