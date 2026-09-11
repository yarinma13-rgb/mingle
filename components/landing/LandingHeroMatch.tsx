"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { MingleLogo } from "@/components/MingleLogo";

const START_HREF = "/start";

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

const CONFETTI_COLORS = ["#F65F7C", "#D83A52", "#9D5CF2", "#0073EA", "#EA1E63", "#7B2FF7"];

type ConfettiSpec = {
  id: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  burstX: number;
  burstY: number;
  fallY: number;
  rotBurst: number;
  rotEnd: number;
};

function generateConfettiSpecs(): ConfettiSpec[] {
  return Array.from({ length: 28 }, (_, i) => {
    const angleDeg = 15 + Math.random() * 150;
    const rad = (angleDeg * Math.PI) / 180;
    const distance = 70 + Math.random() * 130;
    const spin = Math.random() < 0.5 ? 1 : -1;
    const rotBurst = spin * (36 + Math.random() * 70);
    return {
      id: i,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 5 + Math.random() * 5,
      delay: (i % 8) * 0.08,
      duration: 2.2 + Math.random() * 0.5,
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
    <div className="landing-match-stage landing-match-stage-report" aria-hidden="true">
      <div className="landing-match-glow" />

      <div className="landing-hero-report-wrap">
        <div className="landing-mingle-confetti landing-mingle-confetti-report">
          {confetti.map((piece) => (
            <span
              key={piece.id}
              className="landing-mingle-confetti-piece"
              style={{
                width: piece.size,
                height: piece.size * 2.2,
                backgroundColor: piece.color,
                animationDelay: `${piece.delay}s`,
                animationDuration: `${piece.duration}s`,
                ["--burst-x" as string]: `${piece.burstX}px`,
                ["--burst-y" as string]: `${piece.burstY}px`,
                ["--fall-y" as string]: `${piece.fallY}px`,
                ["--rot-burst" as string]: `${piece.rotBurst}deg`,
                ["--rot-end" as string]: `${piece.rotEnd}deg`,
              }}
            />
          ))}
        </div>

        <article className="landing-hero-report">
          <header className="landing-hero-report-head">
            <div>
              <p className="landing-hero-report-role">Senior Product Manager</p>
              <p className="landing-hero-report-meta">
                Tech company · Tel Aviv · Hybrid
              </p>
            </div>
            <p className="landing-hero-report-count">12 Strong Matches</p>
          </header>

          <div className="landing-hero-report-card">
            <div className="landing-hero-report-rank">
              <span>🥇</span>
              <strong>96%</strong>
              <em>High confidence</em>
            </div>

            <p className="landing-hero-report-name">Candidate #184</p>

            <div className="landing-hero-report-fits">
              <div>
                <span>Role Fit</span>
                <b>98%</b>
              </div>
              <div>
                <span>Human Fit</span>
                <b>94%</b>
              </div>
              <div>
                <span>Motivation</span>
                <b>96%</b>
              </div>
            </div>

            <ul className="landing-why-list">
              <li className="is-good">5/5 core requirements</li>
              <li className="is-good">Similar company stage</li>
              <li className="is-good">Strong ownership preference</li>
              <li className="is-good">Salary aligned</li>
              <li className="is-warn">Remote preference: 2 to 3 days · Role: 3 days</li>
            </ul>

            <div className="landing-hero-report-foot">
              <span>Why this match →</span>
              <div className="landing-hero-report-actions">
                <span className="is-love">Interested</span>
                <span>Not relevant</span>
              </div>
            </div>
          </div>
        </article>

        <div className="landing-hero-mingle-pill">
          <MingleLogo variant="mark" size={28} priority className="landing-mingle-mark" />
          <span>It&rsquo;s a mingle</span>
        </div>
      </div>
    </div>
  );
}
