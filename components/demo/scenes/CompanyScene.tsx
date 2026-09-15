"use client";

import { motion } from "framer-motion";
import { Avatar } from "@/components/Avatar";
import { MingleChip } from "@/components/MingleChip";
import { KpiTile } from "@/components/dashboard/KpiTile";
import { IconBadge } from "@/components/dashboard/IconBadge";
import { CompanyPipelineFunnel } from "@/components/dashboard/CompanyPipelineFunnel";
import {
  GaugeIcon,
  PeopleIcon,
  MessageIcon,
  CompassIcon,
  BriefcaseIcon,
} from "@/components/dashboard/icons";
import {
  DEMO_CANDIDATES,
  DEMO_COMPANY,
  DEMO_FUNNEL,
  DEMO_ROLE,
} from "@/lib/demo/data";

function sparkFrom(seed: number): number[] {
  const base = Math.max(1, seed);
  return [base * 0.4, base * 0.5, base * 0.62, base * 0.58, base * 0.8, base];
}

/**
 * Company workspace scene using the same KPI / funnel / candidate table
 * patterns as CompanyDashboard — links stay inside /demo (#) so recording
 * never escapes into authenticated routes.
 */
export function CompanyScene({
  onOpenCandidate,
}: {
  onOpenCandidate?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="flex flex-col gap-6"
    >
      <div className="mingle-banner rounded-2xl border border-mingle-border p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold tracking-tight text-mingle-text">
              Open role
            </h2>
            <p className="mt-1 font-display text-xl font-semibold text-mingle-text">
              {DEMO_ROLE.title}
            </p>
            <p className="mt-1 text-sm text-mingle-text-secondary">
              {DEMO_COMPANY.name} · {DEMO_ROLE.department} · {DEMO_ROLE.seniority}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenCandidate}
            className="mingle-btn-primary text-xs"
          >
            View relevant candidates
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {DEMO_ROLE.requiredSkills.slice(0, 4).map((skill) => (
            <MingleChip key={skill}>{skill}</MingleChip>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiTile
          icon={GaugeIcon}
          label="Profile completion"
          value="100%"
          accent="pink"
          href="#demo"
          sparkline={sparkFrom(100)}
        />
        <KpiTile
          icon={PeopleIcon}
          label="Potential matches"
          value={String(DEMO_CANDIDATES.length)}
          accent="purple"
          href="#demo"
          sparkline={sparkFrom(DEMO_CANDIDATES.length)}
        />
        <KpiTile
          icon={CompassIcon}
          label="Connections"
          value={String(DEMO_FUNNEL.total)}
          accent="blue"
          href="#demo"
          sparkline={sparkFrom(DEMO_FUNNEL.total)}
        />
        <KpiTile
          icon={MessageIcon}
          label="Active conversations"
          value={String(DEMO_FUNNEL.counts.in_conversation)}
          accent="success"
          href="#demo"
          sparkline={sparkFrom(DEMO_FUNNEL.counts.in_conversation)}
        />
        <KpiTile
          icon={BriefcaseIcon}
          label="Interview booked"
          value={String(DEMO_FUNNEL.counts.interview_booked)}
          accent="waiting"
          href="#demo"
          sparkline={sparkFrom(DEMO_FUNNEL.counts.interview_booked)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <CompanyPipelineFunnel funnel={DEMO_FUNNEL} />

        <div className="rounded-2xl border border-mingle-border bg-mingle-white p-6">
          <div className="mb-4 flex items-center gap-3">
            <IconBadge icon={PeopleIcon} accent="blue" size={32} iconSize={15} />
            <h2 className="font-display text-base font-semibold tracking-tight text-mingle-text">
              Relevant candidates
            </h2>
          </div>
          <ul className="flex flex-col">
            {DEMO_CANDIDATES.map((candidate, index) => (
              <li
                key={candidate.userId}
                className="border-b border-mingle-border last:border-0"
              >
                <button
                  type="button"
                  onClick={onOpenCandidate}
                  className={`flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-mingle-bg/60 ${
                    index === 0 ? "demo-highlight rounded-xl px-2 -mx-2" : ""
                  }`}
                >
                  <Avatar
                    photo={candidate.photo}
                    initials={candidate.initials}
                    gender={candidate.gender}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-mingle-text">
                      {candidate.name}
                    </p>
                    <p className="truncate text-xs text-mingle-text-secondary">
                      {candidate.headline}
                    </p>
                  </div>
                  <MingleChip>{candidate.matchScore}% match</MingleChip>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-mingle-text-muted">
            Fictional sample candidates for this product walkthrough.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
