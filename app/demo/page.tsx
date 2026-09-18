import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DemoShell } from "@/components/DemoShell";
import { isDemoRouteEnabled } from "@/lib/demo/access";

export const metadata: Metadata = {
  title: "Product demo | mingle",
  description:
    "Private ~90s investor product demo of mingle — real product UI, guided cursor, and marketing-grade captions.",
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
