import Link from "next/link";
import { UpgradeLock } from "@/components/billing/UpgradeLock";
import { EmptyState } from "@/components/EmptyState";
import {
  days,
  pct,
  type Insight,
  type InterviewIntelligence,
  type RoleSummary,
  type StageStat,
  type WeekBucket,
} from "@/lib/insights/compute";

export type InsightsTab = "reports" | "interviews" | "insights" | "analytics";

export const INSIGHTS_TABS: { id: InsightsTab; label: string; planLabel: "Plus" | "Max" }[] = [
  { id: "reports", label: "Reports", planLabel: "Plus" },
  { id: "interviews", label: "Interview intelligence", planLabel: "Max" },
  { id: "insights", label: "Company insights", planLabel: "Max" },
  { id: "analytics", label: "Analytics", planLabel: "Max" },
];

const LOCK_COPY: Record<InsightsTab, { title: string; body: string }> = {
  reports: {
    title: "Recruitment reports",
    body: "See your pipeline by stage, time to decision and how each role is progressing.",
  },
  interviews: {
    title: "Interview intelligence",
    body: "Turn interviewer feedback into ratings, recommendations and follow-through you can act on.",
  },
  insights: {
    title: "Company insights",
    body: "Plain-language observations about where your hiring is stuck and what to do next.",
  },
  analytics: {
    title: "Advanced analytics",
    body: "Stage-to-stage conversion, time in each stage and weekly trends across your pipeline.",
  },
};

export function InsightsTabs({
  active,
  access,
}: {
  active: InsightsTab;
  access: Record<InsightsTab, boolean>;
}) {
  return (
    <nav aria-label="Insights sections" className="mb-6 flex flex-wrap gap-2">
      {INSIGHTS_TABS.map((tab) => (
        <Link
          key={tab.id}
          href={`/insights?tab=${tab.id}`}
          aria-current={active === tab.id ? "page" : undefined}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
            active === tab.id
              ? "border-mingle-purple bg-mingle-lavender text-mingle-purple"
              : "border-mingle-border bg-mingle-surface text-mingle-text-secondary hover:text-mingle-text"
          }`}
        >
          {tab.label}
          {!access[tab.id] ? <span aria-hidden> 🔒</span> : null}
        </Link>
      ))}
    </nav>
  );
}

export function LockedTab({ tab }: { tab: InsightsTab }) {
  const meta = INSIGHTS_TABS.find((t) => t.id === tab);
  const copy = LOCK_COPY[tab];
  return <UpgradeLock title={copy.title} body={copy.body} planLabel={meta?.planLabel ?? "Max"} />;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-mingle-border bg-mingle-surface p-5 shadow-mingle">
      <h2 className="font-display text-base font-semibold text-mingle-text">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-mingle-bg p-4">
      <p className="text-xs font-medium text-mingle-text-secondary">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-mingle-text">{value}</p>
      {hint ? <p className="mt-1 text-xs text-mingle-text-secondary">{hint}</p> : null}
    </div>
  );
}

function Bar({ label, value, max, suffix }: { label: string; value: number; max: number; suffix?: string }) {
  const width = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <li className="flex items-center gap-3 text-sm">
      <span className="w-40 shrink-0 text-mingle-text-secondary">{label}</span>
      <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-mingle-bg">
        <span
          className="block h-full rounded-full"
          style={{ width: `${width}%`, background: "var(--mingle-accent-purple)" }}
        />
      </span>
      <span className="w-20 shrink-0 text-right font-medium text-mingle-text">
        {value}
        {suffix ?? ""}
      </span>
    </li>
  );
}

export function NoData({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-mingle-text-secondary">{children}</p>;
}

// --------------------------------------------------------------------- tabs

export function ReportsTab({
  stats,
  tth,
  roles,
  totalConnections,
}: {
  stats: StageStat[];
  tth: { averageDays: number | null; sampleSize: number };
  roles: RoleSummary[];
  totalConnections: number;
}) {
  if (totalConnections === 0 && roles.length === 0) {
    return (
      <EmptyState
        title="Nothing to report yet"
        body="Once you connect with candidates and open roles, your pipeline report builds itself here."
        actionHref="/discover"
        actionLabel="Find candidates"
      />
    );
  }
  const max = Math.max(1, ...stats.map((s) => s.reached));
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Candidates in pipeline" value={String(totalConnections)} />
        <Stat
          label="Average time to decision"
          value={days(tth.averageDays)}
          hint={tth.sampleSize > 0 ? `Based on ${tth.sampleSize} ${tth.sampleSize === 1 ? "candidate" : "candidates"}` : "No decisions yet"}
        />
        <Stat label="Open roles" value={String(roles.filter((r) => r.status === "open").length)} />
      </div>
      <Card title="Pipeline by stage">
        <ul className="flex flex-col gap-2.5">
          {stats.map((s) => (
            <Bar key={s.stage} label={s.label} value={s.reached} max={max} />
          ))}
        </ul>
        <p className="mt-3 text-xs text-mingle-text-secondary">Counts candidates who reached each stage or went beyond it.</p>
      </Card>
      <Card title="Roles">
        {roles.length === 0 ? (
          <NoData>No roles yet.</NoData>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-sm">
              <thead>
                <tr className="text-left text-xs text-mingle-text-secondary">
                  <th className="pb-2 font-medium">Role</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Open for</th>
                  <th className="pb-2 font-medium">Candidates</th>
                  <th className="pb-2 font-medium">Interview+</th>
                  <th className="pb-2 font-medium">Decision</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.roleId} className="border-t border-mingle-border">
                    <td className="py-2 font-medium text-mingle-text">{role.title}</td>
                    <td className="py-2 capitalize text-mingle-text-secondary">{role.status}</td>
                    <td className="py-2 text-mingle-text-secondary">{role.openDays}d</td>
                    <td className="py-2">{role.candidates}</td>
                    <td className="py-2">{role.reachedInterview}</td>
                    <td className="py-2">{role.reachedDecision}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-mingle-text-secondary">
          Candidates are attributed to a role when an opportunity is created for it.
        </p>
      </Card>
    </div>
  );
}

export function InterviewsTab({ data }: { data: InterviewIntelligence }) {
  if (data.total === 0 && data.feedbackCount === 0) {
    return (
      <EmptyState
        title="No interviews yet"
        body="Schedule interviews and collect feedback to see ratings, recommendations and follow-through here."
        actionHref="/interviews"
        actionLabel="Go to interviews"
      />
    );
  }
  const dims: { label: string; value: number | null }[] = [
    { label: "Technical fit", value: data.averages.technical },
    { label: "Role fit", value: data.averages.role },
    { label: "Team fit", value: data.averages.team },
    { label: "Motivation", value: data.averages.motivation },
  ];
  const recTotal = data.feedbackCount;
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Interviews" value={String(data.total)} hint={`${data.scheduled} upcoming`} />
        <Stat label="Completed" value={String(data.completed)} />
        <Stat label="Cancelled" value={pct(data.cancellationRate)} hint="of all interviews" />
        <Stat
          label="Feedback submitted"
          value={pct(data.feedbackRate)}
          hint={`${data.feedbackCount} entries · approximate`}
        />
      </div>
      <Card title="Average interviewer ratings">
        {data.feedbackCount === 0 ? (
          <NoData>No feedback yet. Interviewers can add feedback after an interview.</NoData>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {dims.map((d) => (
              <Bar key={d.label} label={d.label} value={d.value === null ? 0 : Number(d.value.toFixed(1))} max={5} suffix={d.value === null ? " –" : " / 5"} />
            ))}
          </ul>
        )}
      </Card>
      <Card title="Interviewer recommendations">
        {recTotal === 0 ? (
          <NoData>No recommendations recorded yet.</NoData>
        ) : (
          <ul className="flex flex-col gap-2.5">
            <Bar label="Advance" value={data.recommendations.advance} max={recTotal} />
            <Bar label="Hold" value={data.recommendations.hold} max={recTotal} />
            <Bar label="Pass" value={data.recommendations.pass} max={recTotal} />
            <Bar label="Not decided" value={data.recommendations.undecided} max={recTotal} />
          </ul>
        )}
      </Card>
    </div>
  );
}

export function InsightsListTab({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) {
    return (
      <EmptyState
        title="Not enough data for insights yet"
        body="We only point things out when there's real evidence. As your pipeline and interviews grow, observations will appear here."
        actionHref="/discover"
        actionLabel="Find candidates"
      />
    );
  }
  const tone = {
    warn: "border-mingle-warning",
    info: "border-mingle-blue",
    good: "border-mingle-success",
  } as const;
  return (
    <ul className="flex flex-col gap-3">
      {insights.map((insight) => (
        <li
          key={insight.title}
          className={`rounded-2xl border-l-4 border-y border-r border-y-mingle-border border-r-mingle-border bg-mingle-surface p-5 shadow-mingle ${tone[insight.tone]}`}
        >
          <p className="font-display text-base font-semibold text-mingle-text">{insight.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-mingle-text-secondary">{insight.body}</p>
        </li>
      ))}
    </ul>
  );
}

export function AnalyticsTab({ stats, weeks }: { stats: StageStat[]; weeks: WeekBucket[] }) {
  const hasData = stats[0]?.reached > 0;
  if (!hasData) {
    return (
      <EmptyState
        title="No pipeline data yet"
        body="Analytics appear once you have connections moving through your pipeline."
        actionHref="/discover"
        actionLabel="Find candidates"
      />
    );
  }
  const maxWeek = Math.max(1, ...weeks.map((w) => w.count));
  return (
    <div className="flex flex-col gap-5">
      <Card title="Stage-to-stage conversion">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[28rem] text-sm">
            <thead>
              <tr className="text-left text-xs text-mingle-text-secondary">
                <th className="pb-2 font-medium">From stage</th>
                <th className="pb-2 font-medium">Reached</th>
                <th className="pb-2 font-medium">Moved on</th>
                <th className="pb-2 font-medium">Avg. time to next</th>
              </tr>
            </thead>
            <tbody>
              {stats.slice(0, -1).map((s) => (
                <tr key={s.stage} className="border-t border-mingle-border">
                  <td className="py-2 font-medium text-mingle-text">{s.label}</td>
                  <td className="py-2">{s.reached}</td>
                  <td className="py-2">{pct(s.conversionToNext)}</td>
                  <td className="py-2 text-mingle-text-secondary">{days(s.avgDaysToNext)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-mingle-text-secondary">
          Time is measured only for candidates who actually moved to the next stage.
        </p>
      </Card>
      <Card title="New connections per week (last 8 weeks)">
        <ul className="flex flex-col gap-2.5">
          {weeks.map((w) => (
            <Bar key={w.weekStart} label={`Week of ${w.weekStart.slice(5)}`} value={w.count} max={maxWeek} />
          ))}
        </ul>
      </Card>
    </div>
  );
}
