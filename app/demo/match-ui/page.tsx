import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isDemoRouteEnabled } from "@/lib/demo/access";
import { MatchUiPreview } from "@/components/demo/MatchUiPreview";

export const metadata: Metadata = {
  title: "Match UI preview | mingle",
  robots: { index: false, follow: false },
};

export default function DemoMatchUiPage() {
  if (!isDemoRouteEnabled()) notFound();
  return (
    <main className="min-h-screen bg-mingle-bg px-4 py-8 sm:px-6">
      <MatchUiPreview />
    </main>
  );
}
