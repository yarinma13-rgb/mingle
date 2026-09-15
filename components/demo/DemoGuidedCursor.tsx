"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  DEMO_CURSOR_SCRIPT,
  activeCursorBeat,
  beatKey,
  type DemoCursorBeat,
} from "@/lib/demo/cursor-script";
import type { DemoSceneId } from "@/lib/demo/scenes";
import { demoEase } from "@/lib/demo/motion";

type Point = { x: number; y: number };
type Ring = { x: number; y: number; w: number; h: number };

function resolveTarget(
  root: HTMLElement,
  target: string,
): { point: Point; ring: Ring } | null {
  const el = root.querySelector(
    `[data-demo-target="${target}"]`,
  ) as HTMLElement | null;
  if (!el) return null;
  const rootRect = root.getBoundingClientRect();
  const rect = el.getBoundingClientRect();
  return {
    point: {
      x: rect.left - rootRect.left + rect.width * 0.62,
      y: rect.top - rootRect.top + rect.height * 0.55,
    },
    ring: {
      x: rect.left - rootRect.left - 6,
      y: rect.top - rootRect.top - 6,
      w: rect.width + 12,
      h: rect.height + 12,
    },
  };
}

function CursorGlyph({ clicking }: { clicking: boolean }) {
  return (
    <motion.svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      animate={{ scale: clicking ? 0.9 : 1 }}
      transition={{ duration: 0.14, ease: demoEase }}
      className="drop-shadow-[0_4px_10px_rgba(22,19,34,0.28)]"
    >
      <path
        d="M5.5 3.8 18.2 12.1l-5.4 1.2 2.4 6.3-2.5.9-2.5-6.5-4.7 3.1V3.8Z"
        fill="#161322"
        stroke="white"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </motion.svg>
  );
}

/**
 * Guided product cursor — stable per-beat positioning (no per-tick remount).
 */
export function DemoGuidedCursor({
  rootRef,
  sceneId,
  elapsedMs,
  enabled,
  reducedMotion = false,
}: {
  rootRef: React.RefObject<HTMLElement | null>;
  sceneId: DemoSceneId;
  elapsedMs: number;
  enabled: boolean;
  reducedMotion?: boolean;
}) {
  const script = DEMO_CURSOR_SCRIPT[sceneId];
  const beat: DemoCursorBeat | null = useMemo(
    () => activeCursorBeat(script, elapsedMs),
    [script, elapsedMs],
  );
  const key = beatKey(beat);
  const lastKeyRef = useRef("");

  const [point, setPoint] = useState<Point | null>(null);
  const [ring, setRing] = useState<Ring | null>(null);
  const [visible, setVisible] = useState(false);
  const [clicking, setClicking] = useState(false);

  useEffect(() => {
    if (!enabled || reducedMotion || !beat || !rootRef.current) {
      setVisible(false);
      setRing(null);
      lastKeyRef.current = "";
      return;
    }

    const changed = key !== lastKeyRef.current;
    lastKeyRef.current = key;

    let cancelled = false;
    const timers: number[] = [];

    const apply = () => {
      if (cancelled || !rootRef.current) return;
      const next = resolveTarget(rootRef.current, beat.target);
      if (!next) {
        setVisible(false);
        return;
      }
      setPoint(next.point);
      setRing(next.ring);
      setVisible(true);
    };

    // Measure once on beat change; one settle remasure only.
    apply();
    if (changed) {
      timers.push(window.setTimeout(apply, 120));
    }

    if (changed && beat.action === "click") {
      setClicking(true);
      timers.push(
        window.setTimeout(() => {
          if (!cancelled) setClicking(false);
        }, 160),
      );
    } else if (changed) {
      setClicking(false);
    }

    return () => {
      cancelled = true;
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [beat, enabled, reducedMotion, rootRef, key]);

  if (!enabled || reducedMotion) return null;

  const typing = beat?.action === "type";

  return (
    <div className="pointer-events-none absolute inset-0 z-[25] overflow-hidden">
      {/* Soft static highlight — no vignette remount flicker */}
      {visible && ring ? (
        <motion.div
          className="absolute rounded-2xl border border-mingle-accent-blue/30 bg-mingle-accent-blue/[0.05]"
          animate={{
            left: ring.x,
            top: ring.y,
            width: ring.w,
            height: ring.h,
            opacity: 1,
          }}
          initial={false}
          transition={{ duration: 0.55, ease: demoEase }}
        />
      ) : null}

      {visible && point ? (
        <motion.div
          className="absolute"
          initial={false}
          animate={{
            opacity: 1,
            x: point.x,
            y: point.y,
          }}
          transition={{
            opacity: { duration: 0.25 },
            x: { duration: 0.65, ease: demoEase },
            y: { duration: 0.65, ease: demoEase },
          }}
          style={{ marginLeft: -2, marginTop: -2 }}
        >
          <CursorGlyph clicking={clicking} />
          <AnimatePresence>
            {clicking ? (
              <motion.span
                key="ripple"
                className="absolute left-1 top-1 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-mingle-accent-blue/40"
                initial={{ opacity: 0.55, scale: 0.5 }}
                animate={{ opacity: 0, scale: 1.45 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: demoEase }}
              />
            ) : null}
          </AnimatePresence>
          {typing ? (
            <span
              aria-hidden
              className="demo-caret absolute left-5 top-5"
              style={{ height: 14 }}
            />
          ) : null}
        </motion.div>
      ) : null}
    </div>
  );
}
