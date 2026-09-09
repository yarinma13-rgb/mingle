"use client";

import { useId } from "react";
import { motion } from "framer-motion";

function TalentGradient({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#EA1E63" />
        <stop offset="100%" stopColor="#7B2FF7" />
      </linearGradient>
    </defs>
  );
}

function CompanyGradient({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#7B2FF7" />
        <stop offset="100%" stopColor="#3E6BE0" />
      </linearGradient>
    </defs>
  );
}

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
        <TalentGradient id={gradientId} />
        <circle cx="20" cy="11" r="9" fill={`url(#${gradientId})`} />
        <path
          d="M8 50 Q8 28, 14 25 Q17 23, 20 23 Q23 23, 26 25 Q32 28, 32 50 Q32 52, 28 52 L12 52 Q8 52, 8 50 Z"
          fill={`url(#${gradientId})`}
        />
      </svg>
    </motion.div>
  );
}

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
        <CompanyGradient id={gradientId} />
        <rect x="4" y="6" width="32" height="44" rx="6" fill={`url(#${gradientId})`} />
        <g fill="rgba(255,255,255,0.3)">
          <rect x="10" y="13" width="6" height="5" rx="1.5" />
          <rect x="24" y="13" width="6" height="5" rx="1.5" />
          <rect x="10" y="23" width="6" height="5" rx="1.5" />
          <rect x="24" y="23" width="6" height="5" rx="1.5" />
          <rect x="10" y="33" width="6" height="5" rx="1.5" />
          <rect x="24" y="33" width="6" height="5" rx="1.5" />
        </g>
        <rect x="15" y="42" width="10" height="8" rx="2" fill="rgba(255,255,255,0.25)" />
      </svg>
    </motion.div>
  );
}
