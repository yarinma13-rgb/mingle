"use client";

import { AnalyticsEvent } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useLandingLocale } from "@/components/landing/LandingLocale";
import { LandingAudienceStage } from "@/components/landing/LandingAudienceStage";
import type { AudienceId } from "@/lib/landing/copy";

const DEMO_HREF = "/contact";

type AudienceContextValue = {
  audienceId: AudienceId;
  setAudienceId: (id: AudienceId) => void;
};

const AudienceContext = createContext<AudienceContextValue | null>(null);

export function LandingAudienceProvider({ children }: { children: ReactNode }) {
  const [audienceId, setAudienceId] = useState<AudienceId>("companies");
  const value = useMemo(
    () => ({ audienceId, setAudienceId }),
    [audienceId],
  );
  return (
    <AudienceContext.Provider value={value}>{children}</AudienceContext.Provider>
  );
}

function useLandingAudience() {
  const ctx = useContext(AudienceContext);
  if (!ctx) {
    throw new Error("useLandingAudience must be used within LandingAudienceProvider");
  }
  return ctx;
}

export function LandingHeroCopy() {
  const { t } = useLandingLocale();
  const { audienceId, setAudienceId } = useLandingAudience();
  const audience =
    t.hero.audiences.find((item) => item.id === audienceId) ??
    t.hero.audiences[0];

  return (
    <div className="landing-hero-copy">
      <p className="landing-hero-eyebrow">{t.hero.eyebrow}</p>
      <h1 id="landing-hero-title" className="landing-hero-title">
        {t.hero.titleLines.map((line) => (
          <span key={line} className="landing-hero-line">
            {line}
          </span>
        ))}
      </h1>
      <p className="landing-hero-lead">{audience.lead}</p>
      <p className="landing-hero-value">{t.hero.value}</p>

      <div className="landing-audience" role="tablist" aria-label="Who mingle is for">
        {t.hero.audiences.map((item) => {
          const active = item.id === audienceId;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={active ? "is-active" : undefined}
              onClick={() => {
              track(AnalyticsEvent.audienceTabSelected, { audience_id: item.id });
              setAudienceId(item.id);
            }}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="landing-hero-actions">
        <Link
          href={
            audienceId === "talents"
              ? "/auth?mode=signup&path=talent"
              : "/auth?mode=signup&path=company"
          }
          onClick={() =>
            track(AnalyticsEvent.landingCtaClicked, {
              cta: "get_started",
              source: "hero",
              audience: audienceId,
            })
          }
          className="landing-btn landing-btn-primary landing-btn-lg landing-btn-rainbow-pulse"
        >
          {t.hero.getStarted}
          <span aria-hidden="true">→</span>
        </Link>
        <Link href={DEMO_HREF}
          onClick={() =>
            track(AnalyticsEvent.landingCtaClicked, {
              cta: "book_demo",
              source: "hero",
            })
          }
          className="landing-btn landing-btn-ghost landing-btn-lg">
          {t.hero.bookDemo}
        </Link>
      </div>

      <p className="landing-hero-hint">
        <span>{t.hero.getStartedHint}</span>
        <span>{t.hero.bookDemoHint}</span>
      </p>
      <p className="landing-hero-note">{t.hero.freeTalent}</p>
    </div>
  );
}

export function LandingHeroMatch() {
  const { audienceId } = useLandingAudience();
  return (
    <div className="landing-match-stage landing-match-stage-audience" aria-hidden="true">
      <div className="landing-match-glow" />
      <LandingAudienceStage audienceId={audienceId} />
    </div>
  );
}
