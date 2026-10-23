import { DashboardHeading } from "@/components/dashboard/DashboardHeading";
import {
  AnalyticsTab,
  InsightsListTab,
  InsightsTabs,
  InterviewsTab,
  LockedTab,
  ReportsTab,
  type InsightsTab,
} from "@/components/insights/InsightsScreen";
import { requireAppUser } from "@/lib/dashboard/require-shell-user";
import { companyHasFeature } from "@/lib/billing/access";
import { resolveCompanyWorkspaceId } from "@/lib/team/persistence";
import { insightsNow, loadInsightsData } from "@/lib/insights/load";
import {
  companyInsights,
  interviewIntelligence,
  roleSummaries,
  stageStats,
  timeToDecision,
  weeklyConnections,
} from "@/lib/insights/compute";

const TABS: InsightsTab[] = ["reports", "interviews", "insights", "analytics"];

function parseTab(value: string | string[] | undefined): InsightsTab {
  const raw = Array.isArray(value) ? value[0] : value;
  return TABS.find((tab) => tab === raw) ?? "reports";
}

export default async function InsightsPage({ searchParams }: PageProps<"/insights">) {
  const { supabase, user } = await requireAppUser({ userType: "company" });
  const companyId = await resolveCompanyWorkspaceId(supabase, user.id);
  const tab = parseTab((await searchParams).tab);

  const [reports, interviews, insights, analytics] = await Promise.all([
    companyHasFeature(supabase, companyId, "advanced_reporting"),
    companyHasFeature(supabase, companyId, "interview_intelligence"),
    companyHasFeature(supabase, companyId, "company_insights"),
    companyHasFeature(supabase, companyId, "advanced_analytics"),
  ]);
  const access = { reports, interviews, insights, analytics };

  // Only load data for a tab the plan unlocks.
  let body: React.ReactNode;
  if (!access[tab]) {
    body = <LockedTab tab={tab} />;
  } else {
    const data = await loadInsightsData(supabase, companyId);
    const now = insightsNow();
    const stats = stageStats(data.pipeline);
    const roles = roleSummaries(data.pipeline, data.roles, now);
    const interviewData = interviewIntelligence(data.interviews, data.feedback);

    if (tab === "reports") {
      body = (
        <ReportsTab
          stats={stats}
          tth={timeToDecision(data.pipeline)}
          roles={roles}
          totalConnections={data.pipeline.length}
        />
      );
    } else if (tab === "interviews") {
      body = <InterviewsTab data={interviewData} />;
    } else if (tab === "insights") {
      body = (
        <InsightsListTab
          insights={companyInsights({ inputs: data.pipeline, roles, interviews: interviewData, stats, now })}
        />
      );
    } else {
      body = (
        <AnalyticsTab
          stats={stats}
          weeks={weeklyConnections(data.pipeline.map((p) => p.createdAt), now)}
        />
      );
    }
  }

  return (
    <>
      <DashboardHeading>Insights</DashboardHeading>
      <InsightsTabs active={tab} access={access} />
      {body}
    </>
  );
}
