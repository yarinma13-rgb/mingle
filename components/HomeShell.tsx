"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence } from "framer-motion";
import { SplashScreen, type SplashVariant } from "@/components/SplashScreen";
import { WelcomeScreen } from "@/components/WelcomeScreen";

const MOBILE_BREAKPOINT = 768;

function subscribeToResize(callback: () => void) {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

function getViewportVariant(): SplashVariant {
  return window.innerWidth < MOBILE_BREAKPOINT ? "mobile" : "web";
}

/** Server has no viewport; assume "web" until the client hydrates and measures. */
function getServerViewportVariant(): SplashVariant {
  return "web";
}

export function HomeShell({ forceSplash }: { forceSplash?: SplashVariant }) {
  const [phase, setPhase] = useState<"splash" | "welcome">("splash");
  const detectedVariant = useSyncExternalStore(
    subscribeToResize,
    getViewportVariant,
    getServerViewportVariant,
  );
  const variant = forceSplash ?? detectedVariant;

  useEffect(() => {
    const hold = variant === "mobile" ? 1800 : 550;
    const timer = setTimeout(() => setPhase("welcome"), hold);
    return () => clearTimeout(timer);
  }, [variant]);

  return (
    <>
      <AnimatePresence>
        {phase === "splash" && (
          <SplashScreen
            key="splash"
            variant={variant}
            onContinue={() => setPhase("welcome")}
          />
        )}
      </AnimatePresence>
      {phase === "welcome" && <WelcomeScreen />}
    </>
  );
}
