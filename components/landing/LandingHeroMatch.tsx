"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { MingleLogo } from "@/components/MingleLogo";

const START_HREF = "/start";

/** Full confetti cycle: burst, then quiet until the next pop at 2.5s. */
const CONFETTI_CYCLE_S = 2.5;

const AUDIENCES = [
  {
    id: "companies",
    label: "Companies",
    lead: "Paste a job description. In seconds, see the few people worth talking to, with a clear Why this match on every recommendation.",
  },
  {
    id: "recruiters",
    label: "Recruiters",
    lead: "Skip the questionnaire. mingle infers what it can, asks only when something critical is missing, and ranks people you should actually spend time on.",
  },
  {
    id: "founders",
    label: "Founders",
    lead: "Open a hard to fill role and get Top Matches with Role Fit, Human Fit, and Motivation Fit, plus the risks before the first call.",
  },
  {
    id: "talent",
    label: "Talent",
    lead: "Your Candidate DNA is inferred from what you already share. When interest is mutual, you and the company both see why the match might work.",
  },
  {
    id: "agencies",
    label: "Agencies",
    lead: "Send clients fewer CVs and more explained matches. Show Role Fit, Human Fit, Motivation Fit, and Match Confidence in one place.",
  },
] as const;

const CONFETTI_COLORS = [
  "#5B8DEF",
  "#4D42DB",
  "#7B8DB8",
  "#3E6BE0",
  "#6C7AE0",
  "#8FA3D4",
  "#9B6CF2",
  "#5A6FE8",
  "#A8B8E8",
  "#4263D6",
  "#7389F0",
  "#6B5CE0",
  "#EA1E63",
  "#C84BDB",
  "#7B2FF7",
  "#E2378D",
];

type ConfettiShape = "bar" | "curl" | "spark";

type ConfettiSpec = {
  id: number;
  shape: ConfettiShape;
  color: string;
  size: number;
  delay: number;
  burstX: number;
  burstY: number;
  fallY: number;
  rotBurst: number;
  rotEnd: number;
};

function pickConfettiShape(index: number): ConfettiShape {
  const lane = index % 10;
  if (lane === 0 || lane === 6) return "spark";
  if (lane === 1 || lane === 2 || lane === 4 || lane === 5 || lane === 8) {
    return "curl";
  }
  return "bar";
}

function generateConfettiSpecs(): ConfettiSpec[] {
  return Array.from({ length: 96 }, (_, i) => {
    const shape = pickConfettiShape(i);
    const angleDeg = 5 + Math.random() * 170;
    const rad = (angleDeg * Math.PI) / 180;
    const distance = 65 + Math.random() * 175;
    const spin = Math.random() < 0.5 ? 1 : -1;
    const rotBurst = spin * (36 + Math.random() * 80);
    const size =
      shape === "curl"
        ? 12 + Math.random() * 10
        : shape === "spark"
          ? 8 + Math.random() * 6
          : 5 + Math.random() * 6;
    return {
      id: i,
      shape,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size,
      // Tiny stagger so one explosion reads as a burst, not a spray over time
      delay: (i % 14) * 0.015,
      burstX: Math.cos(rad) * distance,
      burstY: -Math.sin(rad) * distance,
      fallY: 95 + Math.random() * 120,
      rotBurst,
      rotEnd: rotBurst + spin * (90 + Math.random() * 110),
    };
  });
}

function subscribeReducedMotion(onStoreChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true,
  );
}

export function LandingHeroCopy() {
  const [audienceId, setAudienceId] = useState<(typeof AUDIENCES)[number]["id"]>(
    "companies",
  );
  const audience = AUDIENCES.find((item) => item.id === audienceId) ?? AUDIENCES[0];

  return (
    <div className="landing-hero-copy">
      <p className="landing-hero-eyebrow">Built for hiring teams. Open to talent too.</p>
      <h1 id="landing-hero-title" className="landing-hero-title">
        <span className="landing-hero-line">Post a role.</span>
        <span className="landing-hero-line">Meet the right people.</span>
        <span className="landing-hero-line">See why it fits.</span>
      </h1>
      <p className="landing-hero-lead">{audience.lead}</p>
      <p className="landing-hero-value">
        Hiring teams move with near zero friction. Talent gets matched with clear
        reasons, not black box scores. Company DNA, Candidate DNA, and Role DNA
        stay in the background. Three scores. Honest confidence.
      </p>

      <div className="landing-audience" role="tablist" aria-label="Who mingle is for">
        {AUDIENCES.map((item) => {
          const active = item.id === audienceId;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={active ? "is-active" : undefined}
              onClick={() => setAudienceId(item.id)}
            >
              {active ? "✓ " : ""}
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="landing-hero-actions">
        <Link
          href={START_HREF}
          className="landing-btn landing-btn-primary landing-btn-lg landing-btn-rainbow-pulse"
        >
          Get Started
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      <p className="landing-hero-note">
        The right people, faster ✦ Free to open your first Match Report
      </p>
    </div>
  );
}

function MatchDonut({
  overall,
  role,
  human,
  motivation,
}: {
  overall: number;
  role: number;
  human: number;
  motivation: number;
}) {
  const total = role + human + motivation;
  const roleDeg = (role / total) * 360;
  const humanDeg = (human / total) * 360;
  const style = {
    background: `conic-gradient(
      #ea1e63 0deg ${roleDeg}deg,
      #7b2ff7 ${roleDeg}deg ${roleDeg + humanDeg}deg,
      #3e6be0 ${roleDeg + humanDeg}deg 360deg
    )`,
  } as const;

  return (
    <div className="landing-donut" style={style}>
      <div className="landing-donut-hole">
        <strong>{overall}%</strong>
        <span>Match</span>
      </div>
    </div>
  );
}

export function LandingHeroMatch() {
  const reduceMotion = usePrefersReducedMotion();
  const confetti = useMemo(
    () => (reduceMotion ? [] : generateConfettiSpecs()),
    [reduceMotion],
  );

  return (
    <div className="landing-match-stage" aria-hidden="true">
      <div className="landing-match-glow" />

      <article className="landing-profile landing-profile-talent">
        <header className="landing-profile-head">
          <span className="landing-avatar landing-avatar-talent" aria-hidden="true">
            C
          </span>
          <div className="landing-profile-identity">
            <p className="landing-profile-title">Candidate</p>
            <p className="landing-profile-role">Senior Product Manager</p>
          </div>
        </header>

        <div className="landing-profile-viz">
          <MatchDonut overall={96} role={98} human={94} motivation={96} />
          <ul className="landing-score-chips">
            <li className="is-role"><span>Role</span><b>98%</b></li>
            <li className="is-human"><span>Human</span><b>94%</b></li>
            <li className="is-motivation"><span>Motivation</span><b>96%</b></li>
          </ul>
        </div>

        <ul className="landing-profile-tags">
          <li>B2B SaaS</li>
          <li>Tel Aviv</li>
          <li>Ownership</li>
        </ul>
      </article>

      <div className="landing-match-center">
        <svg
          className="landing-curve-arrows"
          viewBox="0 0 220 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            className="landing-curve-path landing-curve-path-top"
            d="M18 60 C 70 16, 150 16, 202 60"
            strokeWidth="2.5"
            strokeLinecap="round"
            markerStart="url(#landing-arrow-head-start)"
            markerEnd="url(#landing-arrow-head)"
          />
          <defs>
            <linearGradient id="landing-curve-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#EA1E63" />
              <stop offset="55%" stopColor="#7B2FF7" />
              <stop offset="100%" stopColor="#3E6BE0" />
            </linearGradient>
            <marker
              id="landing-arrow-head"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="4"
              orient="auto"
            >
              <path d="M0 0 L8 4 L0 8 Z" fill="#3E6BE0" />
            </marker>
            <marker
              id="landing-arrow-head-start"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="4"
              orient="auto-start-reverse"
            >
              <path d="M0 0 L8 4 L0 8 Z" fill="#EA1E63" />
            </marker>
          </defs>
        </svg>

        <div className="landing-mingle-moment">
          <div className="landing-mingle-confetti">
            {confetti.map((piece) => {
              const sharedStyle = {
                animationDelay: `${piece.delay}s`,
                animationDuration: `${CONFETTI_CYCLE_S}s`,
                ["--burst-x" as string]: `${piece.burstX}px`,
                ["--burst-y" as string]: `${piece.burstY}px`,
                ["--fall-y" as string]: `${piece.fallY}px`,
                ["--rot-burst" as string]: `${piece.rotBurst}deg`,
                ["--rot-end" as string]: `${piece.rotEnd}deg`,
                color: piece.color,
              } as const;

              if (piece.shape === "curl") {
                return (
                  <svg
                    key={piece.id}
                    className="landing-mingle-confetti-piece is-curl"
                    width={piece.size}
                    height={piece.size * 2.15}
                    viewBox="0 0 14 30"
                    aria-hidden="true"
                    style={sharedStyle}
                  >
                    <path
                      d="M7 1.2 C 1.4 5, 12.6 9.2, 7 13.5 C 1.4 17.8, 12.6 22, 7 28.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.1"
                      strokeLinecap="round"
                    />
                  </svg>
                );
              }

              if (piece.shape === "spark") {
                return (
                  <svg
                    key={piece.id}
                    className="landing-mingle-confetti-piece is-spark"
                    width={piece.size}
                    height={piece.size}
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                    style={sharedStyle}
                  >
                    <path
                      d="M8 1.2 L9.1 6.2 L14.8 8 L9.1 9.8 L8 14.8 L6.9 9.8 L1.2 8 L6.9 6.2 Z"
                      fill="currentColor"
                    />
                  </svg>
                );
              }

              return (
                <span
                  key={piece.id}
                  className="landing-mingle-confetti-piece is-bar"
                  style={{
                    ...sharedStyle,
                    width: piece.size,
                    height: piece.size * 2.2,
                    backgroundColor: piece.color,
                  }}
                />
              );
            })}
          </div>

          <div className="landing-mingle-core">
            <div className="landing-mingle-mark-wrap">
              <span className="landing-mingle-mark-glow" />
              <MingleLogo
                variant="mark"
                size={64}
                priority
                className="landing-mingle-mark"
              />
            </div>
            <h2 className="landing-mingle-title">It&rsquo;s a mingle</h2>
          </div>
        </div>
      </div>

      <article className="landing-profile landing-profile-company">
        <header className="landing-profile-head">
          <span className="landing-avatar landing-avatar-company" aria-hidden="true">
            Co
          </span>
          <div className="landing-profile-identity">
            <p className="landing-profile-title">Company</p>
            <p className="landing-profile-role">Series A product team</p>
          </div>
        </header>

        <div className="landing-profile-viz">
          <MatchDonut overall={94} role={97} human={92} motivation={94} />
          <ul className="landing-score-chips">
            <li className="is-role"><span>Role</span><b>97%</b></li>
            <li className="is-human"><span>Human</span><b>92%</b></li>
            <li className="is-motivation"><span>Motivation</span><b>94%</b></li>
          </ul>
        </div>

        <ul className="landing-profile-tags">
          <li>Hybrid</li>
          <li>Flexible</li>
          <li>Open role</li>
        </ul>
      </article>
    </div>
  );
}
