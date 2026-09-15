"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  DEMO_CURSOR_SCRIPT,
  activeCursorBeat,
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
 * data-demo-target nodes with calm easing, zoom-aligned rings, and click pulse.
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
            rect.left - rootRect.left - 8,
            rect.top - rootRect.top - 8,
            rect.width + 16,
            rect.height + 16,
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

    for (const delay of [0, 80, 200, 360, 520]) {
      timers.push(window.setTimeout(apply, delay));
    }

    return () => {
      cancelled = true;
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [beat, enabled, reducedMotion, rootRef, sceneId, elapsedMs]);

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

  const typing = beat?.action === "type";

  return (
    <div className="pointer-events-none absolute inset-0 z-[25] overflow-hidden">
      {/* Soft vignette — dim everything except the focus ring */}
      <AnimatePresence>
        {visible && ring ? (
          <motion.div
            key={`${sceneId}-vignette`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: demoEase }}
            className="demo-focus-vignette absolute inset-0"
            style={{
              background: `radial-gradient(
                ellipse ${Math.max(ring.width * 1.6, 220)}px ${Math.max(ring.height * 1.8, 160)}px
                at ${ring.x + ring.width / 2}px ${ring.y + ring.height / 2}px,
                transparent 0%,
                transparent 42%,
                rgba(22, 19, 34, 0.10) 100%
              )`,
            }}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {visible && ring ? (
          <motion.div
            key={`${sceneId}-${beat?.target}-ring`}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35, ease: demoEase }}
            className="absolute rounded-2xl border border-mingle-accent-blue/40 bg-mingle-accent-blue/[0.07] shadow-[0_0_0_1px_rgba(62,107,224,0.1),0_16px_48px_rgba(62,107,224,0.14)]"
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
            {typing ? (
              <motion.span
                aria-hidden
                className="absolute left-5 top-5 h-4 w-[1.5px] rounded-full bg-mingle-accent-blue"
                animate={{ opacity: [1, 0.15, 1] }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
              />
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
