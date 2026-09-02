import Link from "next/link";
import { KpiTile } from "@/components/dashboard/KpiTile";
import { EmptyState } from "@/components/EmptyState";
import { IconBadge } from "@/components/dashboard/IconBadge";
import {
  GaugeIcon,
  PeopleIcon,
  MessageIcon,
  CompassIcon,
  BriefcaseIcon,
  CalendarIcon,
  FunnelIcon,
} from "@/components/dashboard/icons";

export type CandidateRow = {
  userId: string;
  name: string;
  headline: string;
  location: string;
  matchScore: number;
  updatedAt: string;
};

const PIPELINE_STAGES = [
  "Connected",
  "Exploring",
  "In conversation",
  "Opportunity",
  "Decision",
];

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
}: {
  profileCompletion: number;
  candidates: CandidateRow[];
  accountLabel: string;
}) {
  const avgScore = candidates.length
    ? Math.round(
        candidates.reduce((sum, c) => sum + c.matchScore, 0) /
          candidates.length,
      )
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <KpiTile
          icon={GaugeIcon}
          label="Profile completion"
          value={`${profileCompletion}%`}
          accent="pinkPurple"
        />
        <KpiTile
          icon={PeopleIcon}
          label="Potential matches"
          value={String(candidates.length)}
          accent="purpleCta"
        />
        <KpiTile
          icon={CompassIcon}
          label="New connections"
          value="0"
          accent="ctaPink"
        />
        <KpiTile
          icon={MessageIcon}
          label="Active conversations"
          value="0"
          accent="pinkCta"
        />
        <KpiTile
          icon={BriefcaseIcon}
          label="Open opportunities"
          value="0"
          accent="purplePink"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-2xl border border-mingle-border bg-mingle-surface p-6">
          <div className="flex items-center gap-3">
            <IconBadge icon={FunnelIcon} accent="purpleCta" size={32} iconSize={15} />
            <h2 className="font-display text-sm font-semibold text-mingle-white">
              Your pipeline
            </h2>
            <Link
              href="/board"
              className="ml-auto text-xs font-medium text-mingle-cta"
            >
              Open board
            </Link>
          </div>
          <div className="mt-5 flex flex-col gap-3">
            {PIPELINE_STAGES.map((stage) => (
              <div key={stage} className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-xs text-mingle-text-secondary">
                  {stage}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-mingle-bg">
                  <div className="h-full w-0 rounded-full bg-gradient-to-r from-mingle-pink to-mingle-purple" />
                </div>
                <span className="w-4 shrink-0 text-right text-xs font-medium text-mingle-white">
                  0
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-mingle-text-secondary">
            Your pipeline fills up as you start connecting with talent.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-mingle-border bg-mingle-surface p-6">
            <div className="flex items-center gap-3">
              <IconBadge icon={PeopleIcon} accent="pinkPurple" size={32} iconSize={15} />
              <h2 className="font-display text-sm font-semibold text-mingle-white">
                Your team
              </h2>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-mingle-pink to-mingle-purple font-display text-xs font-bold text-white">
                  {accountLabel.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-mingle-white">
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

          <div className="rounded-2xl border border-mingle-border bg-mingle-surface p-6">
            <div className="flex items-center gap-3">
              <IconBadge icon={CalendarIcon} accent="ctaPink" size={32} iconSize={15} />
              <h2 className="font-display text-sm font-semibold text-mingle-white">
                Upcoming interviews
              </h2>
            </div>
            <p className="mt-3 text-xs text-mingle-text-secondary">
              No interviews scheduled yet. This fills up once you start
              connecting with candidates.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-mingle-border bg-mingle-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold text-mingle-white">
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
                          className="font-medium text-mingle-white transition-colors hover:text-mingle-cta"
                        >
                          {candidate.name}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-mingle-text-secondary">
                        {candidate.headline || "—"}
                      </td>
                      <td className="py-3 pr-4 font-medium text-mingle-purple">
                        {candidate.matchScore}%
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
                  className="flex flex-col gap-1.5 rounded-xl border border-mingle-border bg-mingle-bg p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-mingle-white">
                      {candidate.name}
                    </p>
                    <span className="shrink-0 font-medium text-mingle-purple">
                      {candidate.matchScore}%
                    </span>
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
