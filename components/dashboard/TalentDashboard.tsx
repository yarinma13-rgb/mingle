import Link from "next/link";
import { KpiTile } from "@/components/dashboard/KpiTile";
import { EmptyState } from "@/components/EmptyState";
import {
  GaugeIcon,
  PeopleIcon,
  MessageIcon,
  CompassIcon,
  BookmarkIcon,
} from "@/components/dashboard/icons";

export type CompanyRow = {
  userId: string;
  companyName: string;
  mission: string;
  industry: string;
  location: string;
  matchScore: number;
};

export function TalentDashboard({
  profileCompletion,
  companies,
}: {
  profileCompletion: number;
  companies: CompanyRow[];
}) {
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
          label="Recommended companies"
          value={String(companies.length)}
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
          icon={BookmarkIcon}
          label="Saved companies"
          value="0"
          accent="purplePink"
        />
      </div>

      <div className="rounded-2xl border border-mingle-border bg-mingle-surface p-6">
        <h2 className="font-display text-sm font-semibold text-mingle-white">
          Suggested next step
        </h2>
        <p className="mt-2 text-sm text-mingle-text-secondary">
          {profileCompletion < 100
            ? "Finish your profile so companies can find you."
            : "Explore companies below and start a conversation when one feels right."}
        </p>
        {profileCompletion < 100 && (
          <Link
            href="/profile/build"
            className="mt-4 inline-block rounded-full bg-mingle-cta px-6 py-2.5 font-display text-xs font-semibold text-mingle-white"
          >
            Finish my profile
          </Link>
        )}
      </div>

      <div className="rounded-2xl border border-mingle-border bg-mingle-surface p-6">
        <h2 className="font-display text-sm font-semibold text-mingle-white">
          Recommended companies
        </h2>

        {companies.length === 0 ? (
          <EmptyState
            title="No companies to show yet"
            body="When companies join mingle, the ones that fit your goals will appear here."
            actionHref="/discover"
            actionLabel="Open Discover"
          />
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {companies.map((company) => (
              <Link
                key={company.userId}
                href={`/profile/view/${company.userId}`}
                className="flex flex-col gap-2 rounded-xl border border-mingle-border bg-mingle-bg p-4 transition-colors hover:border-mingle-purple/50"
              >
                <div className="flex items-center justify-between">
                  <p className="font-display text-sm font-semibold text-mingle-white">
                    {company.companyName}
                  </p>
                  <span className="text-xs font-medium text-mingle-purple">
                    {company.matchScore}%
                  </span>
                </div>
                <p className="text-xs text-mingle-text-secondary">
                  {company.mission}
                </p>
                <p className="text-xs text-mingle-text-secondary">
                  {[company.industry, company.location]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
