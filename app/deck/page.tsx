import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DeckShell } from "@/components/deck/DeckShell";
import { isDeckRouteEnabled } from "@/lib/deck/access";

export const metadata: Metadata = {
  title: "mingle deck | Beyond the match",
  description:
    "Private founder pitch deck for mingle: problem, Mutual Matching, product, Business Model, traction and vision.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DeckPage() {
  if (!isDeckRouteEnabled()) notFound();

  return (
    <main className="flex h-[100dvh] min-h-[100dvh] flex-1 flex-col overflow-hidden bg-[#F4F1FA]">
      <Suspense
        fallback={
          <div className="flex min-h-screen flex-1 items-center justify-center text-sm text-[#65647E]">
            Loading deck…
          </div>
        }
      >
        <DeckShell />
      </Suspense>
    </main>
  );
}
