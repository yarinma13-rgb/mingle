"use client";

import { useId } from "react";
import { motion } from "framer-motion";

/**
 * Brand-gradient definition shared by path glyphs.
 * Uses CSS custom properties so they track globals.css.
 */
function GradientDefs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="var(--mingle-pink)" />
        <stop offset="50%" stopColor="var(--mingle-purple)" />
        <stop offset="100%" stopColor="var(--mingle-blue)" />
      </linearGradient>
    </defs>
  );
}

/**
 * A single rounded figure — head + rounded body pillar — matching one half
 * of the mingle M mark. Represents an individual talent.
 */
export function TalentGlyph({
  active = false,
  className = "",
}: {
  active?: boolean;
  className?: string;
}) {
  const gradientId = useId().replace(/:/g, "");
  return (
    <motion.div
      className={className}
      animate={active ? { y: [0, -3, 0] } : { y: 0 }}
      transition={
        active ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" } : undefined
      }
    >
      <svg viewBox="0 0 40 52" width="36" height="46" aria-hidden>
        <GradientDefs id={gradientId} />
        {/* Head */}
        <circle cx="20" cy="11" r="9" fill={`url(#${gradientId})`} />
        {/* Body — rounded pillar with shoulders */}
        <path
          d="M8 50 Q8 28, 14 25 Q17 23, 20 23 Q23 23, 26 25 Q32 28, 32 50 Q32 52, 28 52 L12 52 Q8 52, 8 50 Z"
          fill={`url(#${gradientId})`}
        />
      </svg>
    </motion.div>
  );
}

/**
 * A rounded office tower with a subtle window grid, brand-gradient fill.
 * Clean architectural glyph for the company path.
 */
export function CompanyGlyph({
  active = false,
  className = "",
}: {
  active?: boolean;
  className?: string;
}) {
  const gradientId = useId().replace(/:/g, "");
  return (
    <motion.div
      className={className}
      animate={active ? { y: [0, -3, 0] } : { y: 0 }}
      transition={
        active
          ? { duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.15 }
          : undefined
      }
    >
      <svg viewBox="0 0 40 52" width="36" height="46" aria-hidden>
        <GradientDefs id={gradientId} />
        {/* Main building body */}
        <rect x="4" y="6" width="32" height="44" rx="6" fill={`url(#${gradientId})`} />
        {/* Window grid — subtle cutouts */}
        <g fill="rgba(255,255,255,0.3)">
          {/* Row 1 */}
          <rect x="10" y="13" width="6" height="5" rx="1.5" />
          <rect x="24" y="13" width="6" height="5" rx="1.5" />
          {/* Row 2 */}
          <rect x="10" y="23" width="6" height="5" rx="1.5" />
          <rect x="24" y="23" width="6" height="5" rx="1.5" />
          {/* Row 3 */}
          <rect x="10" y="33" width="6" height="5" rx="1.5" />
          <rect x="24" y="33" width="6" height="5" rx="1.5" />
        </g>
        {/* Door */}
        <rect x="15" y="42" width="10" height="8" rx="2" fill="rgba(255,255,255,0.25)" />
      </svg>
    </motion.div>
  );
}
