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
    lead: "Your Candidate DNA is inferred from what you already share. When a company is interested and you are too, you both see why it might work.",
  },
  {
    id: "agencies",
    label: "Agencies",
    lead: "Send clients fewer CVs and more explained matches. Show Role Fit, Human Fit, Motivation Fit, and Match Confidence in one place.",
  },
] as const;

const CONFETTI_COLORS = [
  "#F65F7C",
  "#D83A52",
  "#9D5CF2",
  "#0073EA",
  "#EA1E63",
  "#7B2FF7",
];

type ConfettiSpec = {
  id: number;
  color: string;
  size: number;
  delay: number;
  burstX: number;
  burstY: number;
  fallY: number;
  rotBurst: number;
  rotEnd: number;
};

function generateConfettiSpecs(): ConfettiSpec[] {
  return Array.from({ length: 30 }, (_, i) => {
    const angleDeg = 12 + Math.random() * 156;
    const rad = (angleDeg * Math.PI) / 180;
    const distance = 75 + Math.random() * 125;
    const spin = Math.random() < 0.5 ? 1 : -1;
    const rotBurst = spin * (36 + Math.random() * 70);
    return {
      id: i,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 5 + Math.random() * 5,
      // Tiny stagger so one explosion reads as a burst, not a spray over time
      delay: (i % 10) * 0.02,
      burstX: Math.cos(rad) * distance,
      burstY: -Math.sin(rad) * distance,
      fallY: 90 + Math.random() * 100,
      rotBurst,
      rotEnd: rotBurst + spin * (80 + Math.random() * 90),
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
      <p className="landing-hero-eyebrow">Intelligence behind the scenes</p>
      <h1 id="landing-hero-title" className="landing-hero-title">
        Post a job. Get the right people. Understand why.
      </h1>
      <p className="landing-hero-lead">{audience.lead}</p>
      <p className="landing-hero-value">
        Near zero friction for recruiters. Company DNA, Candidate DNA, and Role
        DNA are inferred in the background. Three scores. Clear reasons. Honest
        confidence.
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
        <div className="landing-profile-accent" aria-hidden="true" />
        <div className="landing-profile-head">
          <span className="landing-avatar landing-avatar-talent" aria-hidden="true">
            MR
          </span>
          <div className="landing-profile-identity">
            <p className="landing-profile-kicker">Candidate</p>
            <p className="landing-profile-title">Maya R.</p>
            <p className="landing-profile-role">Senior Product Manager</p>
          </div>
          <div className="landing-profile-score" title="Overall match">
            <strong>96</strong>
            <span>Match</span>
          </div>
        </div>

        <ul className="landing-profile-tags">
          <li>B2B SaaS</li>
          <li>0→1</li>
          <li>Tel Aviv</li>
        </ul>

        <div className="landing-profile-fits" aria-hidden="true">
          <div>
            <span>Role</span>
            <i>
              <b className="fill-role" style={{ width: "98%" }} />
            </i>
          </div>
          <div>
            <span>Human</span>
            <i>
              <b className="fill-company" style={{ width: "94%" }} />
            </i>
          </div>
          <div>
            <span>Motivation</span>
            <i>
              <b className="fill-motivation" style={{ width: "96%" }} />
            </i>
          </div>
        </div>

        <div className="landing-profile-signals">
          <p className="landing-signal landing-signal-good">
            Owns ambiguous roadmap work
          </p>
          <p className="landing-signal landing-signal-good">
            Wants high autonomy
          </p>
          <p className="landing-signal landing-signal-warn">
            Prefers 2 office days
          </p>
        </div>
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
            {confetti.map((piece) => (
              <span
                key={piece.id}
                className="landing-mingle-confetti-piece"
                style={{
                  width: piece.size,
                  height: piece.size * 2.2,
                  backgroundColor: piece.color,
                  animationDelay: `${piece.delay}s`,
                  animationDuration: `${CONFETTI_CYCLE_S}s`,
                  ["--burst-x" as string]: `${piece.burstX}px`,
                  ["--burst-y" as string]: `${piece.burstY}px`,
                  ["--fall-y" as string]: `${piece.fallY}px`,
                  ["--rot-burst" as string]: `${piece.rotBurst}deg`,
                  ["--rot-end" as string]: `${piece.rotEnd}deg`,
                }}
              />
            ))}
          </div>

          <div className="landing-mingle-core">
            <div className="landing-mingle-mark-wrap">
              <span className="landing-mingle-mark-glow" />
              <MingleLogo
                variant="mark"
                size={72}
                priority
                className="landing-mingle-mark"
              />
            </div>
            <h2 className="landing-mingle-title">It&rsquo;s a mingle</h2>
          </div>
        </div>
      </div>

      <article className="landing-profile landing-profile-company">
        <div className="landing-profile-accent" aria-hidden="true" />
        <div className="landing-profile-head">
          <span className="landing-avatar landing-avatar-company" aria-hidden="true">
            NW
          </span>
          <div className="landing-profile-identity">
            <p className="landing-profile-kicker">Company</p>
            <p className="landing-profile-title">Northwind</p>
            <p className="landing-profile-role">Series A product team</p>
          </div>
          <div className="landing-profile-score is-company" title="Open role">
            <strong>Open</strong>
            <span>Role</span>
          </div>
        </div>

        <ul className="landing-profile-tags">
          <li>Weekly shipping</li>
          <li>Hybrid</li>
          <li>Ownership</li>
        </ul>

        <div className="landing-profile-fits" aria-hidden="true">
          <div>
            <span>Role</span>
            <i>
              <b className="fill-role" style={{ width: "97%" }} />
            </i>
          </div>
          <div>
            <span>Human</span>
            <i>
              <b className="fill-company" style={{ width: "92%" }} />
            </i>
          </div>
          <div>
            <span>Motivation</span>
            <i>
              <b className="fill-motivation" style={{ width: "94%" }} />
            </i>
          </div>
        </div>

        <div className="landing-profile-signals">
          <p className="landing-signal landing-signal-good">
            Needs founder adjacent PM
          </p>
          <p className="landing-signal landing-signal-good">
            Offers high ownership
          </p>
          <p className="landing-signal landing-signal-warn">
            Role asks 3 office days
          </p>
        </div>
      </article>
    </div>
  );
}
