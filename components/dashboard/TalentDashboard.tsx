import Link from "next/link";
import { KpiTile } from "@/components/dashboard/KpiTile";
import { EmptyState } from "@/components/EmptyState";
import { MingleChip } from "@/components/MingleChip";
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
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <KpiTile
          icon={GaugeIcon}
          label="Profile completion"
          value={`${profileCompletion}%`}
          accent="pink"
          href="/profile/build"
        />
        <KpiTile
          icon={PeopleIcon}
          label="Recommended companies"
          value={String(companies.length)}
          accent="purple"
          href="/discover"
        />
        <KpiTile
          icon={CompassIcon}
          label="New connections"
          value="0"
          accent="blue"
          href="/connections"
        />
        <KpiTile
          icon={MessageIcon}
          label="Active conversations"
          value="0"
          accent="pink"
          href="/conversations"
        />
        <KpiTile
          icon={BookmarkIcon}
          label="Saved companies"
          value="0"
          accent="purple"
          href="/saved"
        />
      </div>

      <div className="mingle-banner rounded-2xl border border-mingle-border p-7">
        <h2 className="font-display text-base font-semibold tracking-tight text-mingle-text">
          Suggested next step
        </h2>
        <p className="mt-2 text-sm text-mingle-text-secondary">
          {profileCompletion < 100
            ? "Finish your profile so companies can find you."
            : "Explore companies below and start a conversation when one feels right."}
        </p>
        {profileCompletion < 100 && (
          <Link href="/profile/build" className="mingle-btn-primary mt-4 inline-block text-xs">
            Finish my profile
          </Link>
        )}
      </div>

      <div className="rounded-2xl border border-mingle-border bg-mingle-white p-7 shadow-mingle">
        <h2 className="font-display text-base font-semibold tracking-tight text-mingle-text">
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
                className="flex flex-col gap-2 rounded-xl border border-mingle-border bg-mingle-bg p-5 transition-all hover:border-mingle-blue/40 hover:bg-mingle-white hover:shadow-[0_8px_24px_rgba(0,115,234,0.1)]"
              >
                <div className="flex items-center justify-between">
                  <p className="font-display text-sm font-semibold text-mingle-text">
                    {company.companyName}
                  </p>
                  <MingleChip>{company.matchScore}% match</MingleChip>
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
