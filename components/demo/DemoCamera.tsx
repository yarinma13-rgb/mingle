"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  DEMO_CURSOR_SCRIPT,
  activeCursorBeat,
  beatKey,
} from "@/lib/demo/cursor-script";
import type { DemoSceneId } from "@/lib/demo/scenes";
import { demoCameraTransition } from "@/lib/demo/motion";

/**
 * Soft monday-style camera — subtle scale toward the active target.
 * Origin locked per beat so the zoom never wobbles on clock ticks.
 */
export function DemoCamera({
  rootRef,
  sceneId,
  elapsedMs,
  enabled,
  reducedMotion = false,
  children,
}: {
  rootRef: React.RefObject<HTMLElement | null>;
  sceneId: DemoSceneId;
  elapsedMs: number;
  enabled: boolean;
  reducedMotion?: boolean;
  children: React.ReactNode;
}) {
  const beat = useMemo(
    () => activeCursorBeat(DEMO_CURSOR_SCRIPT[sceneId], elapsedMs),
    [sceneId, elapsedMs],
  );
  const key = beatKey(beat);
  const inactive = !enabled || reducedMotion;
  const [scale, setScale] = useState(1);
  const [origin, setOrigin] = useState("50% 42%");
  const lastKeyRef = useRef("");

  useEffect(() => {
    if (inactive) {
      lastKeyRef.current = "";
      return;
    }

    if (!beat?.zoom || beat.zoom <= 1.01) {
      if (lastKeyRef.current !== "rest") {
        lastKeyRef.current = "rest";
        setScale(1);
      }
      return;
    }

    if (key === lastKeyRef.current) return;
    lastKeyRef.current = key;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled || !rootRef.current) return;
      const root = rootRef.current;
      const el = root.querySelector(
        `[data-demo-target="${beat.target}"]`,
      ) as HTMLElement | null;

      if (el) {
        const rootRect = root.getBoundingClientRect();
        const rect = el.getBoundingClientRect();
        if (rootRect.width > 8 && rootRect.height > 8) {
          const ox =
            ((rect.left + rect.width / 2 - rootRect.left) / rootRect.width) *
            100;
          const oy =
            ((rect.top + rect.height / 2 - rootRect.top) / rootRect.height) *
            100;
          setOrigin(
            `${Math.max(14, Math.min(86, ox)).toFixed(1)}% ${Math.max(16, Math.min(84, oy)).toFixed(1)}%`,
          );
        }
      }

      setScale(beat.zoom ?? 1);
    }, 80);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [inactive, rootRef, beat, key]);

  const displayScale = inactive ? 1 : scale;
  const displayOrigin = inactive ? "50% 42%" : origin;

  return (
    <motion.div
      className="demo-camera relative flex min-h-0 flex-1 flex-col"
      animate={{ scale: displayScale }}
      transition={reducedMotion ? { duration: 0 } : demoCameraTransition}
      style={{
        transformOrigin: displayOrigin,
        backfaceVisibility: "hidden",
      }}
    >
      {children}
    </motion.div>
  );
}
