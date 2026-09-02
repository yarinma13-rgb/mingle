"use client";

import { useSearchParams } from "next/navigation";
import { HomeShell } from "@/components/HomeShell";
import type { SplashVariant } from "@/components/SplashScreen";

/**
 * Renders the real app flow only — no review chrome. An optional
 * ?splash=mobile|web query param can force a variant for testing;
 * otherwise it behaves exactly like "/".
 */
export function DemoShell() {
  const searchParams = useSearchParams();
  const splashParam = searchParams.get("splash");
  const forceSplash: SplashVariant | undefined =
    splashParam === "mobile" || splashParam === "web" ? splashParam : undefined;

  return <HomeShell key={splashParam ?? "auto"} forceSplash={forceSplash} />;
}
