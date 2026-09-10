import Link from "next/link";
import { KpiTile } from "@/components/dashboard/KpiTile";
import { EmptyState } from "@/components/EmptyState";
import { MingleChip } from "@/components/MingleChip";
import { IconBadge } from "@/components/dashboard/IconBadge";
import { CompanyPipelineFunnel } from "@/components/dashboard/CompanyPipelineFunnel";
import { CompanyPipelineDonut } from "@/components/dashboard/CompanyPipelineDonut";
import type { CompanyFunnel } from "@/lib/dashboard/funnel";
import { Avatar } from "@/components/Avatar";
import type { Gender } from "@/lib/profile/avatar";
import {
  GaugeIcon,
  PeopleIcon,
  MessageIcon,
  CompassIcon,
  BriefcaseIcon,
  CalendarIcon,
} from "@/components/dashboard/icons";

export type CandidateRow = {
  userId: string;
  name: string;
  headline: string;
  location: string;
  matchScore: number;
  updatedAt: string;
  initials: string;
  gender: Gender | null;
  photo: string | null;
};

function timeAgo(iso: string): string {
  const days = Math.max(
    0,
    Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000),
  );
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export function CompanyDashboard({
  profileCompletion,
  candidates,
  accountLabel,
  funnel,
  trends,
}: {
  profileCompletion: number;
  candidates: CandidateRow[];
  accountLabel: string;
  funnel: CompanyFunnel;
  trends?: {
    connections?: number | null;
    conversations?: number | null;
    opportunities?: number | null;
  };
}) {
  const avgScore = candidates.length
    ? Math.round(
        candidates.reduce((sum, c) => sum + c.matchScore, 0) /
          candidates.length,
      )
    : null;

  return (
    <div className="flex flex-col gap-8">
      <div className="mingle-banner rounded-2xl border border-mingle-border p-7">
        <h2 className="font-display text-base font-semibold tracking-tight text-mingle-text">
          Suggested next step
        </h2>
        <p className="mt-2 text-sm text-mingle-text-secondary">
          {profileCompletion < 100
            ? "Finish your company profile so talent can find you."
            : "Open Discover and start conversations with people who fit."}
        </p>
        {profileCompletion < 100 ? (
          <Link
            href="/company-profile/build"
            className="mingle-btn-primary mt-4 inline-block text-xs"
          >
            Finish company profile
          </Link>
        ) : (
          <Link href="/discover" className="mingle-btn-primary mt-4 inline-block text-xs">
            Open Discover
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <KpiTile
          icon={GaugeIcon}
          label="Profile completion"
          value={`${profileCompletion}%`}
          accent="pink"
          href="/company-profile/build"
        />
        <KpiTile
          icon={PeopleIcon}
          label="Potential matches"
          value={String(candidates.length)}
          accent="purple"
          href="/discover"
        />
        <KpiTile
          icon={CompassIcon}
          label="Connections"
          value={String(funnel.total)}
          accent="blue"
          href="/connections"
          trendPercent={trends?.connections ?? null}
        />
        <KpiTile
          icon={MessageIcon}
          label="Active conversations"
          value={String(funnel.counts.in_conversation)}
          accent="success"
          href="/conversations"
          trendPercent={trends?.conversations ?? null}
        />
        <KpiTile
          icon={BriefcaseIcon}
          label="Open opportunities"
          value={String(funnel.counts.opportunity)}
          accent="waiting"
          href="/board"
          trendPercent={trends?.opportunities ?? null}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <CompanyPipelineFunnel funnel={funnel} />
        <CompanyPipelineDonut funnel={funnel} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-mingle-border bg-mingle-white p-7 transition-shadow hover:shadow-mingle">
            <div className="flex items-center gap-3">
              <IconBadge icon={PeopleIcon} accent="blue" size={32} iconSize={15} />
              <h2 className="font-display text-base font-semibold tracking-tight text-mingle-text">
                Your team
              </h2>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar
                  initials={accountLabel.slice(0, 2).toUpperCase() || "?"}
                  size="sm"
                />
                <div>
                  <p className="text-sm font-medium text-mingle-text">
                    {accountLabel}
                  </p>
                  <p className="text-xs text-mingle-text-secondary">You</p>
                </div>
              </div>
            </div>
            <p className="mt-4 text-xs text-mingle-text-secondary">
              Invite teammates once your workspace is ready.
            </p>
          </div>

          <div className="rounded-2xl border border-mingle-border bg-mingle-white p-7 transition-shadow hover:shadow-mingle">
            <div className="flex items-center gap-3">
              <IconBadge icon={CalendarIcon} accent="waiting" size={32} iconSize={15} />
              <h2 className="font-display text-base font-semibold tracking-tight text-mingle-text">
                Upcoming interviews
              </h2>
            </div>
            <p className="mt-3 text-xs text-mingle-text-secondary">
              No interviews scheduled yet. This fills up once you start
              connecting with candidates.
            </p>
          </div>
      </div>

      <div className="rounded-2xl border border-mingle-border bg-mingle-white p-7">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold tracking-tight text-mingle-text">
            Candidates
          </h2>
          {avgScore !== null && (
            <span className="text-xs text-mingle-text-secondary">
              Avg match {avgScore}%
            </span>
          )}
        </div>

        {candidates.length === 0 ? (
          <EmptyState
            title="No candidates to show yet"
            body="As talent joins mingle, people who fit what you are looking for will appear here."
            actionHref="/discover"
            actionLabel="Open Discover"
          />
        ) : (
          <>
            {/* Table on tablet and up; a table forces a fixed min-width
                that would otherwise force the whole page to scroll
                sideways on a phone, so mobile gets a stacked card list
                of the same data instead. */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-mingle-border text-xs uppercase tracking-wide text-mingle-text-secondary">
                    <th className="py-2.5 font-medium">Name</th>
                    <th className="py-2.5 font-medium">Role</th>
                    <th className="py-2.5 font-medium">Match</th>
                    <th className="py-2.5 font-medium">Location</th>
                    <th className="py-2.5 font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((candidate) => (
                    <tr
                      key={candidate.userId}
                      className="border-b border-mingle-border last:border-0"
                    >
                      <td className="py-3 pr-4">
                        <Link
                          href={`/profile/view/${candidate.userId}`}
                          className="font-medium text-mingle-text transition-colors hover:text-mingle-cta"
                        >
                          {candidate.name}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-mingle-text-secondary">
                        {candidate.headline || "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <MingleChip>{candidate.matchScore}% match</MingleChip>
                      </td>
                      <td className="py-3 pr-4 text-mingle-text-secondary">
                        {candidate.location || "—"}
                      </td>
                      <td className="py-3 text-mingle-text-secondary">
                        {timeAgo(candidate.updatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 md:hidden">
              {candidates.map((candidate) => (
                <Link
                  key={candidate.userId}
                  href={`/profile/view/${candidate.userId}`}
                  className="flex flex-col gap-1.5 rounded-xl border border-mingle-border bg-mingle-bg p-5 transition-all hover:border-mingle-blue/40 hover:bg-mingle-white hover:shadow-mingle"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-mingle-text">
                      {candidate.name}
                    </p>
                    <MingleChip className="shrink-0">
                      {candidate.matchScore}% match
                    </MingleChip>
                  </div>
                  <p className="text-xs text-mingle-text-secondary">
                    {candidate.headline || "—"}
                  </p>
                  <p className="text-xs text-mingle-text-secondary">
                    {[candidate.location, timeAgo(candidate.updatedAt)]
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
