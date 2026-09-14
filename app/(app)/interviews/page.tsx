import { DashboardHeading } from "@/components/dashboard/DashboardHeading";
import { InterviewsScreen } from "@/components/interviews/InterviewsScreen";
import { requireAppUser } from "@/lib/dashboard/require-shell-user";
import { loadDisplayInfoForUsers } from "@/lib/connections/enrich";
import {
  isMissingInterviewsTable,
  loadCompanyInterviews,
  type InterviewRecord,
} from "@/lib/interviews/persistence";
import { resolveCompanyWorkspaceId } from "@/lib/team/persistence";

export default async function InterviewsPage() {
  const { supabase, user } = await requireAppUser({
    userType: "company",
  });

  let interviews: InterviewRecord[] = [];
  let tableMissing = false;
  const namesByConnection: Record<string, string> = {};

  try {
    const companyId = await resolveCompanyWorkspaceId(supabase, user.id);
    interviews = await loadCompanyInterviews(supabase, companyId);
    const connectionIds = [...new Set(interviews.map((row) => row.connectionId))];
    if (connectionIds.length > 0) {
      const { data: connections } = await supabase
        .from("connections")
        .select("id, requester_id, recipient_id")
        .in("id", connectionIds);
      const otherIds = (connections ?? []).map((row) =>
        row.requester_id === companyId ? row.recipient_id : row.requester_id,
      );
      const info = await loadDisplayInfoForUsers(supabase, otherIds);
      for (const row of connections ?? []) {
        const otherId =
          row.requester_id === companyId ? row.recipient_id : row.requester_id;
        namesByConnection[row.id] = info.get(otherId)?.name ?? "Candidate";
      }
    }
  } catch (error) {
    tableMissing = isMissingInterviewsTable(
      error && typeof error === "object"
        ? (error as { message?: string; code?: string })
        : null,
    );
    if (!tableMissing) throw error;
  }

  return (
    <>
      <DashboardHeading>Interviews</DashboardHeading>
      <div className="flex flex-col gap-6">
        <p className="max-w-xl text-sm leading-relaxed text-mingle-text-secondary">
          Scheduled conversations with candidates. Times live on mingle until
          Google or Outlook is connected.
        </p>
        <InterviewsScreen
          interviews={interviews}
          namesByConnection={namesByConnection}
          tableMissing={tableMissing}
        />
      </div>
    </>
  );
}
