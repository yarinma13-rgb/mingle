"use client";

import { ProfileDetailShell } from "@/components/profile-detail/ProfileDetailShell";
import { RoleMatchesScreen } from "@/components/roles/RoleMatchesScreen";
import { CompanyDiscoverDesk } from "@/components/discovery/CompanyDiscoverDesk";
import type { DiscoveryCard } from "@/components/discovery/DiscoveryScreen";
import {
  DEMO_CANDIDATES,
  DEMO_DANIEL,
  DEMO_EMMA,
  DEMO_EMMA_MATCH_REPORT,
  DEMO_EMMA_SECTIONS,
  DEMO_IDS,
  DEMO_ROLE,
  DEMO_WHAT_TO_EXPLORE,
} from "@/lib/demo/data";
import type { MatchReport } from "@/lib/matching/report";

function reportForScore(score: number): MatchReport {
  const scale = score / DEMO_EMMA_MATCH_REPORT.overall;
  return {
    ...DEMO_EMMA_MATCH_REPORT,
    overall: score,
    axes: DEMO_EMMA_MATCH_REPORT.axes.map((axis) => ({
      ...axis,
      score: Math.min(100, Math.round(axis.score * scale)),
    })),
  };
}

const PREVIEW_CARDS: DiscoveryCard[] = DEMO_CANDIDATES.slice(0, 3).map(
  (candidate) => ({
    userId: candidate.userId,
    name: candidate.name,
    subtitle: candidate.headline,
    meta: candidate.location,
    initial: candidate.initials,
    photo: candidate.photo,
    gender: candidate.gender,
    score: candidate.matchScore,
    factors: [],
    report: reportForScore(candidate.matchScore),
    skills: [...DEMO_DANIEL.skills],
  }),
);

/**
 * Static preview of company match list + candidate profile shell —
 * gated behind /demo/match-ui for visual QA against product mockups.
 */
export function MatchUiPreview() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
      <header className="flex flex-col gap-1">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-mingle-purple">
          Demo preview
        </p>
        <h1 className="font-display text-2xl font-bold tracking-tight text-mingle-text">
          Company match UI
        </h1>
        <p className="text-sm text-mingle-text-secondary">
          Perfect matches list + candidate profile — product mockup layout.
        </p>
      </header>

      <section id="perfect-matches" aria-label="Perfect matches preview">
        <RoleMatchesScreen
          roleId={DEMO_IDS.role}
          roleTitle={DEMO_ROLE.title}
          requiredSkills={[...DEMO_ROLE.requiredSkills]}
          cards={PREVIEW_CARDS}
          viewerId={DEMO_IDS.companyUser}
          feedbackByUser={{}}
          filters={null}
        />
      </section>

      <section id="discover-desk" aria-label="Company Discover desktop preview">
        <h2 className="mb-3 font-display text-lg font-bold tracking-tight text-mingle-text">
          Discover (company desktop)
        </h2>
        <CompanyDiscoverDesk
          card={PREVIEW_CARDS[0]}
          initialFeedback={null}
          viewerId={DEMO_IDS.companyUser}
          onPass={() => {}}
          onHide={() => {}}
        />
      </section>

      <section id="candidate-profile" aria-label="Candidate profile preview">
        <ProfileDetailShell
          eyebrow="Talent profile"
          photo={DEMO_DANIEL.photo}
          initial={DEMO_DANIEL.initials}
          gender={DEMO_DANIEL.gender}
          name={DEMO_DANIEL.name}
          subtitle={DEMO_DANIEL.headline}
          meta={`${DEMO_DANIEL.location.split("·")[0]?.trim() ?? DEMO_DANIEL.location} · Product`}
          sections={[
            {
              title: "About",
              text: `${DEMO_DANIEL.experience} · B.Sc. Computer Science`,
            },
            ...DEMO_EMMA_SECTIONS.filter((s) => s.title !== "About"),
          ]}
          whyMatch={null}
          matchReport={DEMO_EMMA_MATCH_REPORT}
          whatToExplore={[...DEMO_WHAT_TO_EXPLORE]}
          viewerId={DEMO_IDS.companyUser}
          targetUserId={DEMO_IDS.daniel}
          initialConnectionStatus={null}
          initiallySaved={false}
          showCv
          cvPath={null}
        />
      </section>

      <p className="pb-8 text-center text-xs text-mingle-text-secondary">
        Also featuring {DEMO_EMMA.name} in the match list above.
      </p>
    </div>
  );
}
