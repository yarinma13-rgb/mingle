"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  DEMO_CURSOR_SCRIPT,
  type DemoCursorBeat,
} from "@/lib/demo/cursor-script";
import type { DemoSceneId } from "@/lib/demo/scenes";
import { demoEase } from "@/lib/demo/motion";

type Point = { x: number; y: number };

function resolveTargetPoint(
  root: HTMLElement,
  target: string,
): Point | null {
  const el = root.querySelector(
    `[data-demo-target="${target}"]`,
  ) as HTMLElement | null;
  if (!el) return null;
  const rootRect = root.getBoundingClientRect();
  const rect = el.getBoundingClientRect();
  return {
    x: rect.left - rootRect.left + rect.width * 0.62,
    y: rect.top - rootRect.top + rect.height * 0.55,
  };
}

function activeBeat(
  script: DemoCursorBeat[] | undefined,
  elapsedMs: number,
): DemoCursorBeat | null {
  if (!script?.length) return null;
  let current: DemoCursorBeat | null = null;
  for (const beat of script) {
    if (beat.atMs <= elapsedMs) current = beat;
  }
  return current;
}

function CursorGlyph({ clicking }: { clicking: boolean }) {
  return (
    <motion.svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      animate={{ scale: clicking ? 0.88 : 1 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      className="drop-shadow-[0_6px_14px_rgba(22,19,34,0.35)]"
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
 * Guided product cursor for investor recordings — moves between
 * data-demo-target nodes with calm easing and a soft click pulse.
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
  const beat = useMemo(
    () => activeBeat(script, elapsedMs),
    [script, elapsedMs],
  );

  const [point, setPoint] = useState<Point | null>(null);
  const [visible, setVisible] = useState(false);
  const [clicking, setClicking] = useState(false);
  const [ring, setRing] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!enabled || reducedMotion || !beat || !rootRef.current) {
      setVisible(false);
      setRing(null);
      return;
    }

    let cancelled = false;
    const timers: number[] = [];

    const apply = () => {
      if (cancelled || !rootRef.current) return;
      const next = resolveTargetPoint(rootRef.current, beat.target);
      if (!next) {
        setVisible(false);
        return;
      }
      setPoint(next);
      setVisible(true);

      const el = rootRef.current.querySelector(
        `[data-demo-target="${beat.target}"]`,
      ) as HTMLElement | null;
      if (el) {
        const rootRect = rootRef.current.getBoundingClientRect();
        const rect = el.getBoundingClientRect();
        setRing(
          new DOMRect(
            rect.left - rootRect.left - 6,
            rect.top - rootRect.top - 6,
            rect.width + 12,
            rect.height + 12,
          ),
        );
      }

      if (beat.action === "click") {
        setClicking(true);
        timers.push(
          window.setTimeout(() => {
            if (!cancelled) setClicking(false);
          }, 180),
        );
      } else {
        setClicking(false);
      }
    };

    // Remeasure a few times — scene content may still be animating in.
    for (const delay of [0, 80, 200, 360]) {
      timers.push(window.setTimeout(apply, delay));
    }

    return () => {
      cancelled = true;
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [beat, enabled, reducedMotion, rootRef, sceneId, elapsedMs]);

  // Re-measure on resize while visible
  useEffect(() => {
    if (!enabled || !beat || !rootRef.current) return;
    const onResize = () => {
      const next = resolveTargetPoint(rootRef.current!, beat.target);
      if (next) setPoint(next);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [beat, enabled, rootRef]);

  if (!enabled || reducedMotion) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[25] overflow-hidden">
      <AnimatePresence>
        {visible && ring ? (
          <motion.div
            key={`${sceneId}-${beat?.target}-ring`}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35, ease: demoEase }}
            className="absolute rounded-2xl border border-mingle-accent-blue/35 bg-mingle-accent-blue/[0.06] shadow-[0_0_0_1px_rgba(62,107,224,0.08),0_12px_40px_rgba(62,107,224,0.12)]"
            style={{
              left: ring.x,
              top: ring.y,
              width: ring.width,
              height: ring.height,
            }}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {visible && point ? (
          <motion.div
            key="demo-cursor"
            className="absolute"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: 1,
              scale: 1,
              x: point.x,
              y: point.y,
            }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{
              opacity: { duration: 0.2 },
              scale: { duration: 0.2 },
              x: { duration: 0.55, ease: demoEase },
              y: { duration: 0.55, ease: demoEase },
            }}
            style={{ marginLeft: -2, marginTop: -2 }}
          >
            <CursorGlyph clicking={clicking} />
            <AnimatePresence>
              {clicking ? (
                <motion.span
                  key="ripple"
                  className="absolute left-1 top-1 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-mingle-accent-blue/50"
                  initial={{ opacity: 0.7, scale: 0.4 }}
                  animate={{ opacity: 0, scale: 1.6 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45, ease: demoEase }}
                />
              ) : null}
            </AnimatePresence>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
