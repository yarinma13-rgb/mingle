"use client";

import { useSearchParams } from "next/navigation";
import { ProductDemoExperience } from "@/components/demo/ProductDemoExperience";

/**
 * Investor-ready product demo at /demo.
 * Optional ?autoplay=0 starts paused for manual screen recording control.
 * Legacy ?splash= is ignored — splash testing remains on / and /demo/mascot.
 */
export function DemoShell() {
  const searchParams = useSearchParams();
  const autoplayParam = searchParams.get("autoplay");
  const initialAutoplay = autoplayParam !== "0" && autoplayParam !== "false";

  return <ProductDemoExperience initialAutoplay={initialAutoplay} />;
}
