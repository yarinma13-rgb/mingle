"use client";

import { useId } from "react";
import { motion } from "framer-motion";

/**
 * Welcome-path visuals — product moments, not person/building glyphs.
 * Talent: match agent spark. Company: explained shortlist radar.
 */

export function TalentPathArt({ className = "" }: { className?: string }) {
  const gid = useId().replace(/:/g, "");

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0.9, y: 4 }}
      animate={{ opacity: 1, y: [0, -3, 0] }}
      transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg viewBox="0 0 88 72" width="88" height="72" aria-hidden>
        <defs>
          <linearGradient id={`${gid}-a`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#EA1E63" />
            <stop offset="55%" stopColor="#7B2FF7" />
            <stop offset="100%" stopColor="#3E6BE0" />
          </linearGradient>
          <linearGradient id={`${gid}-b`} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#FF7AB2" />
            <stop offset="100%" stopColor="#8B5CFF" />
          </linearGradient>
          <filter id={`${gid}-glow`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* soft orbit */}
        <ellipse
          cx="44"
          cy="38"
          rx="30"
          ry="18"
          fill="none"
          stroke={`url(#${gid}-a)`}
          strokeOpacity="0.22"
          strokeWidth="1.5"
          strokeDasharray="3 5"
        />

        {/* agent core */}
        <circle
          cx="44"
          cy="34"
          r="16"
          fill={`url(#${gid}-a)`}
          filter={`url(#${gid}-glow)`}
        />
        <circle cx="44" cy="34" r="11" fill="rgba(255,255,255,0.18)" />
        {/* simple agent face mark */}
        <circle cx="39" cy="32" r="1.7" fill="#fff" />
        <circle cx="49" cy="32" r="1.7" fill="#fff" />
        <path
          d="M39 39c1.6 2.4 4.4 2.4 6 0"
          fill="none"
          stroke="#fff"
          strokeWidth="1.6"
          strokeLinecap="round"
        />

        {/* floating match chip */}
        <g transform="translate(58 10)">
          <rect width="26" height="16" rx="8" fill="#fff" stroke="#E8E2F5" />
          <circle cx="9" cy="8" r="3.2" fill={`url(#${gid}-b)`} />
          <path
            d="M14.2 8.1h8.6"
            stroke="#C9C0DC"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>

        {/* why spark */}
        <g transform="translate(4 46)">
          <rect width="34" height="18" rx="9" fill="#fff" stroke="#E8E2F5" />
          <text
            x="17"
            y="12"
            textAnchor="middle"
            fill="#6B4DE0"
            fontSize="7"
            fontFamily="system-ui, sans-serif"
            fontWeight="700"
          >
            Why it fits
          </text>
        </g>
      </svg>
    </motion.div>
  );
}

export function CompanyPathArt({ className = "" }: { className?: string }) {
  const gid = useId().replace(/:/g, "");

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0.9, y: 4 }}
      animate={{ opacity: 1, y: [0, -3, 0] }}
      transition={{
        duration: 3.2,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 0.2,
      }}
    >
      <svg viewBox="0 0 88 72" width="88" height="72" aria-hidden>
        <defs>
          <linearGradient id={`${gid}-c`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7B2FF7" />
            <stop offset="100%" stopColor="#3E6BE0" />
          </linearGradient>
          <linearGradient id={`${gid}-ring`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#5B8DEF" />
          </linearGradient>
        </defs>

        {/* shortlist card */}
        <rect
          x="10"
          y="8"
          width="68"
          height="56"
          rx="14"
          fill="#fff"
          stroke="#E7E1F4"
        />
        <rect
          x="10"
          y="8"
          width="68"
          height="16"
          rx="14"
          fill={`url(#${gid}-c)`}
        />
        <rect x="10" y="16" width="68" height="8" fill={`url(#${gid}-c)`} />
        <text
          x="44"
          y="19"
          textAnchor="middle"
          fill="#fff"
          fontSize="7.5"
          fontFamily="system-ui, sans-serif"
          fontWeight="700"
        >
          Top matches
        </text>

        {/* rows with rings */}
        {[0, 1, 2].map((i) => {
          const y = 30 + i * 11;
          const pct = 97 - i * 4;
          const r = 5;
          const c = 2 * Math.PI * r;
          const dash = (pct / 100) * c;
          return (
            <g key={i}>
              <circle cx="22" cy={y} r="5.5" fill={`url(#${gid}-c)`} opacity={0.85 - i * 0.15} />
              <circle
                cx="40"
                cy={y}
                r={r}
                fill="none"
                stroke="#E8E6EF"
                strokeWidth="1.6"
              />
              <circle
                cx="40"
                cy={y}
                r={r}
                fill="none"
                stroke={`url(#${gid}-ring)`}
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${c}`}
                transform={`rotate(-90 40 ${y})`}
              />
              <path
                d="M50 ${y}h22"
                stroke="#D9D3E8"
                strokeWidth="2"
                strokeLinecap="round"
                transform={`translate(0 ${y})`}
              />
              <line
                x1="50"
                y1={y}
                x2="72"
                y2={y}
                stroke="#D9D3E8"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
          );
        })}
      </svg>
    </motion.div>
  );
}

/** @deprecated Prefer TalentPathArt / CompanyPathArt */
export function TalentGlyph(props: { active?: boolean; className?: string }) {
  return <TalentPathArt className={props.className} />;
}

/** @deprecated Prefer TalentPathArt / CompanyPathArt */
export function CompanyGlyph(props: { active?: boolean; className?: string }) {
  return <CompanyPathArt className={props.className} />;
}
