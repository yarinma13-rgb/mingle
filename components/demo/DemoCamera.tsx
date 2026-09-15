"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  DEMO_CURSOR_SCRIPT,
  activeCursorBeat,
} from "@/lib/demo/cursor-script";
import type { DemoSceneId } from "@/lib/demo/scenes";
import { demoEase } from "@/lib/demo/motion";

/**
 * Soft monday-style camera — scales toward the active data-demo-target
 * via transform-origin so focus stays locked without pan drift.
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
  const [scale, setScale] = useState(1);
  const [origin, setOrigin] = useState("50% 42%");

  useEffect(() => {
    if (!enabled || reducedMotion || !rootRef.current) {
      setScale(1);
      setOrigin("50% 42%");
      return;
    }

    const beat = activeCursorBeat(DEMO_CURSOR_SCRIPT[sceneId], elapsedMs);
    if (!beat?.zoom || beat.zoom <= 1.01) {
      setScale(1);
      return;
    }

    let cancelled = false;
    const timers: number[] = [];

    const measure = () => {
      if (cancelled || !rootRef.current) return;
      const root = rootRef.current;
      const el = root.querySelector(
        `[data-demo-target="${beat.target}"]`,
      ) as HTMLElement | null;
      if (!el) {
        setScale(beat.zoom ?? 1);
        return;
      }

      const rootRect = root.getBoundingClientRect();
      const rect = el.getBoundingClientRect();
      if (rootRect.width < 8 || rootRect.height < 8) return;

      const ox =
        ((rect.left + rect.width / 2 - rootRect.left) / rootRect.width) * 100;
      const oy =
        ((rect.top + rect.height / 2 - rootRect.top) / rootRect.height) * 100;

      setOrigin(
        `${Math.max(8, Math.min(92, ox)).toFixed(2)}% ${Math.max(10, Math.min(88, oy)).toFixed(2)}%`,
      );
      setScale(beat.zoom ?? 1.1);
    };

    for (const delay of [0, 90, 220, 400]) {
      timers.push(window.setTimeout(measure, delay));
    }

    return () => {
      cancelled = true;
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [enabled, reducedMotion, rootRef, sceneId, elapsedMs]);

  return (
    <motion.div
      className="demo-camera relative flex min-h-0 flex-1 flex-col will-change-transform"
      animate={{ scale }}
      transition={{
        duration: reducedMotion ? 0 : 0.7,
        ease: demoEase,
      }}
      style={{ transformOrigin: origin }}
    >
      {children}
    </motion.div>
  );
}
