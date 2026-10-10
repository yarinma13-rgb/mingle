"use client";

import { useSearchParams } from "next/navigation";
import { ProductDemoExperience } from "@/components/demo/ProductDemoExperience";

/**
 * Investor-ready cinematic product film at /demo.
 * Optional ?autoplay=0 starts paused.
 * Optional ?record=1 hides transport controls for clean capture.
 */
export function DemoShell() {
  const searchParams = useSearchParams();
  const autoplayParam = searchParams.get("autoplay");
  const recordParam = searchParams.get("record");
  const initialAutoplay = autoplayParam !== "0" && autoplayParam !== "false";
  const recordMode = recordParam === "1" || recordParam === "true";

  return (
    <ProductDemoExperience
      initialAutoplay={initialAutoplay}
      recordMode={recordMode}
    />
  );
}
