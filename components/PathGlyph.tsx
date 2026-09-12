"use client";

import { useId } from "react";

/**
 * Single clean path symbols for welcome cards.
 * One mark = candidates, one mark = companies. No scenes, no dashboards.
 */

function SoftMark({
  children,
  from,
  to,
  className = "",
}: {
  children: React.ReactNode;
  from: string;
  to: string;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 88 88"
      width="72"
      height="72"
      aria-hidden
      className={className}
    >
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
        <filter id={`${id}-s`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="6"
            stdDeviation="6"
            floodColor={from}
            floodOpacity="0.28"
          />
        </filter>
      </defs>
      <circle
        cx="44"
        cy="44"
        r="34"
        fill={`url(#${id}-g)`}
        filter={`url(#${id}-s)`}
      />
      <circle cx="44" cy="44" r="34" fill="url(#${id}-g)" opacity="0" />
      {children}
    </svg>
  );
}

/** Candidate / talent mark — refined person symbol */
export function TalentPathArt({ className = "" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 88 88"
      width="72"
      height="72"
      aria-hidden
      className={className}
    >
      <defs>
        <linearGradient id={`${id}-g`} x1="12" y1="8" x2="76" y2="80">
          <stop offset="0%" stopColor="#FF5B8A" />
          <stop offset="55%" stopColor="#9B5CFF" />
          <stop offset="100%" stopColor="#5B7CFF" />
        </linearGradient>
        <filter id={`${id}-s`} x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow
            dx="0"
            dy="8"
            stdDeviation="7"
            floodColor="#9B5CFF"
            floodOpacity="0.3"
          />
        </filter>
      </defs>
      <circle
        cx="44"
        cy="44"
        r="34"
        fill={`url(#${id}-g)`}
        filter={`url(#${id}-s)`}
      />
      {/* soft highlight */}
      <ellipse cx="34" cy="30" rx="14" ry="10" fill="white" opacity="0.18" />
      {/* person */}
      <circle cx="44" cy="34" r="10" fill="white" />
      <path
        d="M24.5 64.5c2.8-12.2 9.4-18 19.5-18s16.7 5.8 19.5 18"
        fill="white"
      />
    </svg>
  );
}

/** Company mark — refined building / org symbol */
export function CompanyPathArt({ className = "" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 88 88"
      width="72"
      height="72"
      aria-hidden
      className={className}
    >
      <defs>
        <linearGradient id={`${id}-g`} x1="12" y1="10" x2="78" y2="78">
          <stop offset="0%" stopColor="#7B5CFF" />
          <stop offset="100%" stopColor="#3E7BFF" />
        </linearGradient>
        <filter id={`${id}-s`} x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow
            dx="0"
            dy="8"
            stdDeviation="7"
            floodColor="#5B7CFF"
            floodOpacity="0.3"
          />
        </filter>
      </defs>
      <circle
        cx="44"
        cy="44"
        r="34"
        fill={`url(#${id}-g)`}
        filter={`url(#${id}-s)`}
      />
      <ellipse cx="34" cy="30" rx="14" ry="10" fill="white" opacity="0.18" />
      {/* building */}
      <rect x="29" y="26" width="30" height="34" rx="4" fill="white" />
      <rect x="35" y="48" width="8" height="12" rx="1.5" fill={`url(#${id}-g)`} />
      <g fill={`url(#${id}-g)`} opacity="0.9">
        <rect x="34" y="32" width="5" height="5" rx="1" />
        <rect x="42" y="32" width="5" height="5" rx="1" />
        <rect x="50" y="32" width="5" height="5" rx="1" />
        <rect x="34" y="40" width="5" height="5" rx="1" />
        <rect x="42" y="40" width="5" height="5" rx="1" />
        <rect x="50" y="40" width="5" height="5" rx="1" />
      </g>
    </svg>
  );
}

export function TalentGlyph(props: { active?: boolean; className?: string }) {
  return <TalentPathArt className={props.className} />;
}

export function CompanyGlyph(props: { active?: boolean; className?: string }) {
  return <CompanyPathArt className={props.className} />;
}
