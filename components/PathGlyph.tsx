"use client";

import { useId } from "react";
import { motion } from "framer-motion";

/**
 * A single rounded head+arch figure — the same silhouette language as the
 * two halves of the MINGLE M mark — used as the building block for the
 * path glyphs below. Not a stock icon; derived from the brand mark itself.
 */
function Figure({
  gradientId,
  x = 0,
  scale = 1,
  opacity = 1,
}: {
  gradientId: string;
  x?: number;
  scale?: number;
  opacity?: number;
}) {
  return (
    <g transform={`translate(${x} 0) scale(${scale})`} opacity={opacity}>
      <circle cx="16" cy="9" r="7" fill={`url(#${gradientId})`} />
      <path
        d="M4 40 C4 23 8 17 16 17 C24 17 28 23 28 40 Z"
        fill={`url(#${gradientId})`}
      />
    </g>
  );
}

function GradientDefs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="var(--mingle-pink)" />
        <stop offset="100%" stopColor="var(--mingle-purple)" />
      </linearGradient>
    </defs>
  );
}

/** One figure — represents an individual charting their own path. */
export function TalentGlyph({
  active = false,
  className = "",
}: {
  active?: boolean;
  className?: string;
}) {
  const gradientId = useId();
  return (
    <motion.div
      className={className}
      animate={active ? { y: [0, -3, 0] } : { y: 0 }}
      transition={
        active ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" } : undefined
      }
    >
      <svg viewBox="0 0 32 40" width="34" height="42" aria-hidden>
        <GradientDefs id={gradientId} />
        <Figure gradientId={gradientId} />
      </svg>
    </motion.div>
  );
}

/**
 * A single rounded office tower with a window grid — a clean building
 * glyph only, no person silhouette mixed in, matching the same rounded
 * squircle radius and gradient fill as the rest of the brand mark.
 */
export function CompanyGlyph({
  active = false,
  className = "",
}: {
  active?: boolean;
  className?: string;
}) {
  const gradientId = useId();
  return (
    <motion.div
      className={className}
      animate={active ? { y: [0, -3, 0] } : { y: 0 }}
      transition={
        active ? { duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.15 } : undefined
      }
    >
      <svg viewBox="0 0 36 42" width="34" height="40" aria-hidden>
        <GradientDefs id={gradientId} />
        <rect x="4" y="4" width="28" height="36" rx="7" fill={`url(#${gradientId})`} />
        <g fill="var(--mingle-bg)" opacity="0.35">
          <rect x="10" y="11" width="5" height="5" rx="1.5" />
          <rect x="21" y="11" width="5" height="5" rx="1.5" />
          <rect x="10" y="19.5" width="5" height="5" rx="1.5" />
          <rect x="21" y="19.5" width="5" height="5" rx="1.5" />
          <rect x="10" y="28" width="5" height="5" rx="1.5" />
          <rect x="21" y="28" width="5" height="5" rx="1.5" />
        </g>
      </svg>
    </motion.div>
  );
}
