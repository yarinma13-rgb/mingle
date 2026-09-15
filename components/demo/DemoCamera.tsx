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
 * Origin is locked per beat (not remeasured every tick) to prevent wobble.
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
  const [scale, setScale] = useState(1);
  const [origin, setOrigin] = useState("50% 42%");
  const lastKeyRef = useRef("");

  useEffect(() => {
    if (!enabled || reducedMotion) {
      setScale(1);
      setOrigin("50% 42%");
      lastKeyRef.current = "";
      return;
    }

    if (!beat || !beat.zoom || beat.zoom <= 1.01) {
      setScale(1);
      lastKeyRef.current = key;
      return;
    }

    // Only remeasure when the attention target changes — never every clock tick.
    if (key === lastKeyRef.current && scale > 1) return;
    lastKeyRef.current = key;

    let cancelled = false;
    const apply = () => {
      if (cancelled || !rootRef.current) return;
      const root = rootRef.current;
      const el = root.querySelector(
        `[data-demo-target="${beat.target}"]`,
      ) as HTMLElement | null;

      if (el) {
        const rootRect = root.getBoundingClientRect();
        const rect = el.getBoundingClientRect();
        if (rootRect.width > 8 && rootRect.height > 8) {
          // Undo current visual scale so origin stays stable in layout space.
          const currentScale = scale || 1;
          const cx =
            (rect.left + rect.width / 2 - rootRect.left - rootRect.width / 2) /
              currentScale +
            rootRect.width / 2;
          const cy =
            (rect.top + rect.height / 2 - rootRect.top - rootRect.height / 2) /
              currentScale +
            rootRect.height / 2;
          const ox = (cx / rootRect.width) * 100;
          const oy = (cy / rootRect.height) * 100;
          setOrigin(
            `${Math.max(12, Math.min(88, ox)).toFixed(1)}% ${Math.max(14, Math.min(86, oy)).toFixed(1)}%`,
          );
        }
      }

      setScale(beat.zoom ?? 1);
    };

    // Single delayed measure after content settles — no multi-fire bounce.
    const timer = window.setTimeout(apply, 60);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // Intentionally omit `scale` — we only want beat-key changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, reducedMotion, rootRef, sceneId, key]);

  return (
    <motion.div
      className="demo-camera relative flex min-h-0 flex-1 flex-col"
      animate={{ scale: enabled && !reducedMotion ? scale : 1 }}
      transition={
        reducedMotion ? { duration: 0 } : demoCameraTransition
      }
      style={{
        transformOrigin: origin,
        // Promote to own layer once — avoids paint thrash while zooming.
        backfaceVisibility: "hidden",
      }}
    >
      {children}
    </motion.div>
  );
}
