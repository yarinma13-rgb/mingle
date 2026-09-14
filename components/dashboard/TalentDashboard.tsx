import Link from "next/link";
import { KpiTile } from "@/components/dashboard/KpiTile";
import { EmptyState } from "@/components/EmptyState";
import { MingleChip } from "@/components/MingleChip";
import { CandidateDnaPanel } from "@/components/profile/CandidateDnaPanel";
import type { CandidateDna } from "@/lib/matching/dna";
import type { TalentDashboardStats } from "@/lib/dashboard/talent-stats";
import {
  BookmarkIcon,
  CompassIcon,
  GaugeIcon,
  MessageIcon,
  PeopleIcon,
} from "@/components/dashboard/icons";
import { ProfileCompletionRing } from "@/components/dashboard/ProfileCompletionRing";
import { TalentMatchOverview } from "@/components/dashboard/TalentMatchOverview";
import { PilotTips } from "@/components/pilot/PilotTips";

function timeAgo(iso: string): string {
  const days = Math.max(
    0,
    Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000),
  );
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export type CompanyRow = {
  userId: string;
  companyName: string;
  mission: string;
  industry: string;
  location: string;
  matchScore: number;
  updatedAt?: string;
};

function sparkFrom(seed: number): number[] {
  const base = Math.max(1, seed);
  return [base * 0.35, base * 0.55, base * 0.45, base * 0.7, base * 0.85, base];
}

export function TalentDashboard({
  profileCompletion,
  companies,
  dna,
  stats,
  missingPhoto = false,
}: {
  profileCompletion: number;
  companies: CompanyRow[];
  dna: CandidateDna | null;
  stats: TalentDashboardStats;
  missingPhoto?: boolean;
}) {
  return (
    <div className="flex flex-col gap-8">
      <PilotTips />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <KpiTile
          icon={GaugeIcon}
          label="Profile completion"
          value={`${profileCompletion}%`}
          accent="pink"
          href="/profile/build"
          sparkline={sparkFrom(profileCompletion)}
        />
        <KpiTile
          icon={PeopleIcon}
          label="Recommended companies"
          value={String(companies.length)}
          accent="purple"
          href="/discover"
          sparkline={sparkFrom(companies.length)}
        />
        <KpiTile
          icon={CompassIcon}
          label="New connections"
          value={String(stats.newConnections)}
          accent="blue"
          href="/connections"
          sparkline={sparkFrom(stats.newConnections)}
        />
        <KpiTile
          icon={MessageIcon}
          label="Active conversations"
          value={String(stats.activeConversations)}
          accent="magenta"
          href="/conversations"
          sparkline={sparkFrom(stats.activeConversations)}
        />
        <KpiTile
          icon={BookmarkIcon}
          label="Saved companies"
          value={String(stats.savedCompanies)}
          accent="violet"
          href="/saved"
          sparkline={sparkFrom(stats.savedCompanies)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
        <ProfileCompletionRing percent={profileCompletion} />
        <div className="mingle-banner rounded-2xl border border-mingle-border p-7">
          <h2 className="font-display text-base font-semibold tracking-tight text-mingle-text">
            Suggested next step
          </h2>
          <p className="mt-2 text-sm text-mingle-text-secondary">
            {profileCompletion < 100
              ? "Finish your profile so companies can find you."
              : missingPhoto
                ? "Add a profile photo so companies recognize you faster."
                : "Explore companies below and start a conversation when one feels right."}
          </p>
          {profileCompletion < 100 ? (
            <Link href="/profile/build" className="mingle-btn-primary mt-4 inline-block text-xs">
              Finish my profile
            </Link>
          ) : missingPhoto ? (
            <Link href="/profile/build" className="mingle-btn-primary mt-4 inline-block text-xs">
              Add a photo
            </Link>
          ) : (
            <Link href="/discover" className="mingle-btn-primary mt-4 inline-block text-xs">
              Open Discover
            </Link>
          )}
        </div>
      </div>

      <TalentMatchOverview
        matchScores={companies.map((company) => company.matchScore)}
        activity={{
          newConnections: stats.newConnections,
          activeConversations: stats.activeConversations,
          savedCompanies: stats.savedCompanies,
        }}
      />

      {dna ? <CandidateDnaPanel dna={dna} /> : null}

      <div className="rounded-2xl border border-mingle-border bg-mingle-surface-elevated p-7 shadow-mingle">
        <h2 className="font-display text-base font-semibold tracking-tight text-mingle-text">
          Recommended companies
        </h2>
        <p className="mt-1.5 text-sm text-mingle-text-secondary">
          Companies that line up with your Candidate DNA.
        </p>

        {companies.length === 0 ? (
          <EmptyState
            title="No companies to show yet"
            body="When companies join mingle, the ones that fit your goals will appear here."
            actionHref="/discover"
            actionLabel="Open Discover"
          />
        ) : (
          <>
            <div className="mt-4 hidden overflow-x-auto md:block">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-mingle-border text-xs uppercase tracking-wide text-mingle-text-secondary">
                    <th className="py-2.5 font-medium">Company</th>
                    <th className="py-2.5 font-medium">Focus</th>
                    <th className="py-2.5 font-medium">Match</th>
                    <th className="py-2.5 font-medium">Location</th>
                    <th className="py-2.5 font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company) => (
                    <tr
                      key={company.userId}
                      className="border-b border-mingle-border last:border-0"
                    >
                      <td className="py-3 pr-4">
                        <Link
                          href={`/profile/view/${company.userId}`}
                          className="font-medium text-mingle-text transition-colors hover:text-mingle-cta"
                        >
                          {company.companyName}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-mingle-text-secondary">
                        {company.industry || company.mission || "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <MingleChip>{company.matchScore}% match</MingleChip>
                      </td>
                      <td className="py-3 pr-4 text-mingle-text-secondary">
                        {company.location || "—"}
                      </td>
                      <td className="py-3 text-mingle-text-secondary">
                        {company.updatedAt ? timeAgo(company.updatedAt) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-col gap-3 md:hidden">
              {companies.map((company) => (
                <Link
                  key={company.userId}
                  href={`/profile/view/${company.userId}`}
                  className="group flex flex-col gap-2.5 rounded-2xl border border-mingle-border bg-mingle-bg p-5 transition-all hover:-translate-y-0.5 hover:border-mingle-blue/35 hover:bg-mingle-white hover:shadow-mingle"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-display text-sm font-semibold tracking-tight text-mingle-text transition-colors group-hover:text-mingle-cta">
                      {company.companyName}
                    </p>
                    <MingleChip tone="pink">{company.matchScore}% match</MingleChip>
                  </div>
                  <p className="text-xs leading-relaxed text-mingle-text-secondary">
                    {company.mission}
                  </p>
                  <p className="text-[11px] font-medium text-mingle-text-secondary/90">
                    {[
                      company.industry,
                      company.location,
                      company.updatedAt ? timeAgo(company.updatedAt) : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
