"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  DEMO_FOCUS_SCRIPT,
  activeFocusBeat,
} from "@/lib/demo/focus-script";
import type { DemoSceneId } from "@/lib/demo/scenes";
import { demoEase } from "@/lib/demo/motion";

type Rect = { top: number; left: number; width: number; height: number };

/**
 * Cinematic focus highlight — soft bright window around a data-demo-target.
 * Surrounding UI stays visible; emphasis shifts without aggressive zoom.
 */
export function DemoFocusHighlight({
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
  const beat = useMemo(
    () => activeFocusBeat(DEMO_FOCUS_SCRIPT[sceneId], elapsedMs),
    [sceneId, elapsedMs],
  );
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    if (!enabled || reducedMotion || !beat || !rootRef.current) {
      setRect(null);
      return;
    }

    let cancelled = false;
    let raf = 0;

    const measure = () => {
      if (cancelled || !rootRef.current) return;
      const root = rootRef.current;
      const el = root.querySelector(
        `[data-demo-target="${beat.target}"]`,
      ) as HTMLElement | null;
      if (!el) {
        setRect(null);
        return;
      }
      const rootBox = root.getBoundingClientRect();
      const box = el.getBoundingClientRect();
      const pad = 10;
      setRect({
        top: box.top - rootBox.top - pad,
        left: box.left - rootBox.left - pad,
        width: box.width + pad * 2,
        height: box.height + pad * 2,
      });
    };

    measure();
    raf = window.requestAnimationFrame(measure);
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [beat, enabled, reducedMotion, rootRef, elapsedMs]);

  const show = Boolean(enabled && !reducedMotion && beat && rect);

  return (
    <AnimatePresence>
      {show && rect ? (
        <motion.div
          key={`${sceneId}-${beat!.target}-${beat!.atMs}`}
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[35]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: demoEase }}
        >
          {/* Soft veil — keeps UI readable, dims the rest */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 0%, rgba(28,27,46,0.18) 72%)",
            }}
          />
          <motion.div
            className="absolute rounded-[14px]"
            style={{
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              boxShadow:
                "0 0 0 1.5px rgba(255,255,255,0.92), 0 0 0 6px rgba(123,47,247,0.12), 0 12px 40px rgba(28,27,46,0.12), 0 0 80px rgba(234,30,99,0.08)",
              background:
                "linear-gradient(135deg, rgba(253,234,241,0.22), rgba(241,232,254,0.18), rgba(233,239,254,0.22))",
            }}
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.4, ease: demoEase }}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
