import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin/access";
import { loadGrowthDashboardData } from "@/lib/admin/growth-dashboard";
import { KpiTile } from "@/components/dashboard/KpiTile";
import {
  PeopleIcon,
  CheckCircleIcon,
  GaugeIcon,
  TargetIcon,
  BriefcaseIcon,
  UserIcon,
  BookmarkIcon,
  ClockIcon,
} from "@/components/dashboard/icons";

const CHANNEL_LABELS: Record<string, string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  facebook: "Facebook",
  referral: "Referral",
  company_outreach: "Company outreach",
  organic: "Organic / SEO",
  direct: "Direct",
  other: "Other",
  unknown: "Unknown (before this shipped)",
};

export default async function AdminGrowthPage() {
  await requireAdmin();
  const data = await loadGrowthDashboardData(14);
  const { snapshot } = data;

  return (
    <AdminShell title="Growth">
      <p className="text-xs text-mingle-text-secondary">
        Last 14 days · {new Date(snapshot.start).toLocaleDateString()} –{" "}
        {new Date(snapshot.end).toLocaleDateString()}
        {snapshot.source === "unavailable" ? " · service role key missing, showing zeros" : ""}
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <KpiTile
          icon={PeopleIcon}
          label="Total signups"
          value={String(snapshot.current.signups)}
          accent="blue"
          href="/admin/growth"
        />
        <KpiTile
          icon={CheckCircleIcon}
          label="Activated users"
          value={String(snapshot.current.ahaReached)}
          accent="success"
          href="/admin/growth"
        />
        <KpiTile
          icon={GaugeIcon}
          label="Activation rate"
          value={`${data.activationRate}%`}
          accent="pink"
          href="/admin/growth"
        />
        <KpiTile
          icon={TargetIcon}
          label="Matches (mingles)"
          value={String(snapshot.current.minglesCreated)}
          accent="violet"
          href="/admin/growth"
        />
        <KpiTile
          icon={BriefcaseIcon}
          label="Active companies"
          value={String(snapshot.current.activeCompanies)}
          accent="purple"
          href="/admin/growth"
        />
        <KpiTile
          icon={UserIcon}
          label="Active candidates"
          value={String(snapshot.current.activeTalents)}
          accent="magenta"
          href="/admin/growth"
        />
        <KpiTile
          icon={BookmarkIcon}
          label="Referral signups"
          value={String(data.referralSignups)}
          accent="waiting"
          href="/admin/growth"
        />
        <KpiTile
          icon={ClockIcon}
          label="Returning users"
          value={String(data.returningUsers)}
          accent="blue"
          href="/admin/growth"
        />
      </div>

      <div className="rounded-2xl border border-mingle-border bg-mingle-white p-5">
        <h2 className="font-display text-sm font-semibold text-mingle-text">
          Acquisition source
        </h2>
        <p className="mt-0.5 text-xs text-mingle-text-secondary">
          Signups in this window, by channel.
        </p>
        {data.acquisitionBreakdown.length === 0 ? (
          <p className="mt-3 text-sm text-mingle-text-secondary">
            No signups in this window.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {data.acquisitionBreakdown.map((row) => (
              <li
                key={row.channel}
                className="flex items-center justify-between rounded-lg border border-mingle-border px-3 py-2 text-sm"
              >
                <span className="text-mingle-text">
                  {CHANNEL_LABELS[row.channel] ?? row.channel}
                </span>
                <span className="font-display font-semibold text-mingle-text">
                  {row.count}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}
