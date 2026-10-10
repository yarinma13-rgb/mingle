import { notFound } from "next/navigation";
import { RoleCandidatesScreen } from "@/components/roles/RoleCandidatesScreen";
import { requireAppUser } from "@/lib/dashboard/require-shell-user";
import { resolveCompanyWorkspaceId } from "@/lib/team/persistence";
import { loadAcceptedConnections } from "@/lib/connections/persistence";
import { loadDisplayInfoForUsers } from "@/lib/connections/enrich";
import { loadCompanyRole } from "@/lib/roles/persistence";
import { salaryAlignment } from "@/lib/roles/salary-alignment";

export default async function RoleDetailPage({
  params,
}: PageProps<"/roles/[id]">) {
  const { id } = await params;
  const { supabase, user } = await requireAppUser({
    userType: "company",
  });
  const companyId = await resolveCompanyWorkspaceId(supabase, user.id);

  const role = await loadCompanyRole(supabase, id, companyId);
  if (!role) notFound();

  const accepted = await loadAcceptedConnections(supabase, companyId);
  const talentIds = accepted.map((row) =>
    row.requester_id === companyId ? row.recipient_id : row.requester_id,
  );
  const info = await loadDisplayInfoForUsers(supabase, talentIds);

  const { data: salaryRows, error: salaryError } = talentIds.length
    ? await supabase
        .from("talent_profiles")
        .select("user_id, salary_expectation")
        .in("user_id", talentIds)
    : { data: [] as { user_id: string; salary_expectation: number | null }[], error: null };

  const expectationByUser = new Map<string, number | null>();
  if (
    salaryError &&
    !/salary_expectation|schema cache|column/i.test(salaryError.message)
  ) {
    throw salaryError;
  }
  for (const row of salaryRows ?? []) {
    expectationByUser.set(row.user_id, row.salary_expectation);
  }

  const candidates = accepted
    .map((row) => {
      const talentId =
        row.requester_id === companyId ? row.recipient_id : row.requester_id;
      const display = info.get(talentId);
      if (!display) return null;
      return {
        connectionId: row.id,
        userId: talentId,
        ...display,
        salaryAlignment: salaryAlignment(
          expectationByUser.get(talentId),
          role.salaryMin,
          role.salaryMax,
        ),
      };
    })
    .filter((row) => row !== null);

  return (
    <RoleCandidatesScreen roleTitle={role.title} candidates={candidates} />
  );
}
