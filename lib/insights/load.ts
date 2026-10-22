import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { loadAcceptedConnections } from "@/lib/connections/persistence";
import { loadTimelinesForConnections } from "@/lib/relationship/persistence";
import { loadCompanyRoles } from "@/lib/roles/persistence";
import { findOriginatingRole } from "@/lib/relationship/originating-role";
import { isMissingInterviewsTable, loadCompanyInterviews } from "@/lib/interviews/persistence";
import type { FeedbackInput, InterviewInput, PipelineInput } from "@/lib/insights/compute";

export type InsightsData = {
  pipeline: PipelineInput[];
  roles: { id: string; title: string; status: "open" | "paused" | "closed"; createdAt: string }[];
  interviews: InterviewInput[];
  feedback: FeedbackInput[];
};

/** Everything the Insights tabs need, read with the viewer's own (RLS-scoped) client. */
export async function loadInsightsData(
  supabase: SupabaseClient<Database>,
  companyId: string,
): Promise<InsightsData> {
  const [accepted, roles, interviews] = await Promise.all([
    loadAcceptedConnections(supabase, companyId),
    loadCompanyRoles(supabase, companyId).catch(() => []),
    loadCompanyInterviews(supabase, companyId).catch((error) => {
      if (isMissingInterviewsTable(error)) return [];
      throw error;
    }),
  ]);

  const timelines = await loadTimelinesForConnections(
    supabase,
    accepted.map((row) => row.id),
  );

  const pipeline: PipelineInput[] = accepted.map((row) => {
    const timeline = timelines.get(row.id) ?? [];
    return {
      connectionId: row.id,
      createdAt: row.created_at,
      events: timeline.map((event) => ({ stage: event.stage, createdAt: event.created_at })),
      roleId: findOriginatingRole(timeline, roles)?.id ?? null,
    };
  });

  const { data: matchRows } = await supabase.from("matches").select("id").eq("company_id", companyId);
  const matchIds = (matchRows ?? []).map((row) => row.id);
  let feedback: FeedbackInput[] = [];
  if (matchIds.length > 0) {
    const { data: feedbackRows } = await supabase
      .from("interview_feedback")
      .select("technical_fit, role_fit, team_fit, motivation_fit, recommendation")
      .in("match_id", matchIds);
    feedback = (feedbackRows ?? []).map((row) => ({
      technicalFit: row.technical_fit,
      roleFit: row.role_fit,
      teamFit: row.team_fit,
      motivationFit: row.motivation_fit,
      recommendation: row.recommendation,
    }));
  }

  return {
    pipeline,
    roles: roles.map((role) => ({
      id: role.id,
      title: role.title,
      status: role.status,
      createdAt: role.createdAt,
    })),
    interviews: interviews.map((row) => ({ status: row.status, scheduledAt: row.scheduledAt })),
    feedback,
  };
}

/** Wall clock for the page (kept out of the component body so render stays pure). */
export function insightsNow(): number {
  return Date.now();
}
