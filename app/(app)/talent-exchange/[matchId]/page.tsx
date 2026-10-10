import { notFound, redirect } from "next/navigation";
import { DashboardHeading } from "@/components/dashboard/DashboardHeading";
import { TalentExchangeResponse } from "@/components/talent-exchange/TalentExchangeResponse";
import { requireAppUser } from "@/lib/dashboard/require-shell-user";
import { loadDisplayInfoForUsers } from "@/lib/connections/enrich";
import { loadCompanyMatchInput, loadTalentMatchInput } from "@/lib/matching/context";
import { computeMatch, type CompanyMatchInput } from "@/lib/matching/engine";
import { buildMatchReport } from "@/lib/matching/report";
import { parseSkillRequirements } from "@/lib/matching/skill-requirement-tiers";

export default async function TalentExchangeMatchPage({
  params,
}: PageProps<"/talent-exchange/[matchId]">) {
  const { matchId } = await params;
  const { supabase, user, userRow } = await requireAppUser();
  if (userRow.user_type !== "talent") redirect("/dashboard");

  const { data: match } = await supabase
    .from("matches")
    .select("id, company_id, candidate_id, role_id")
    .eq("id", matchId)
    .maybeSingle();
  if (!match || match.candidate_id !== user.id) notFound();

  const { data: interest } = await supabase
    .from("talent_exchange_interest")
    .select("status, candidate_interested")
    .eq("match_id", matchId)
    .maybeSingle();
  if (!interest) notFound();

  const [companyInfo, talentInput, companyInput, roleRow] = await Promise.all([
    loadDisplayInfoForUsers(supabase, [match.company_id]),
    loadTalentMatchInput(supabase, user.id),
    loadCompanyMatchInput(supabase, match.company_id),
    match.role_id
      ? supabase
          .from("roles")
          .select("title, department, required_skills, skill_requirements, salary_min, salary_max")
          .eq("id", match.role_id)
          .maybeSingle()
          .then((res) => res.data)
      : Promise.resolve(null),
  ]);

  const scopedCompanyInput: CompanyMatchInput | null =
    companyInput && roleRow
      ? {
          ...companyInput,
          roleTitle: roleRow.title,
          roleDepartment: roleRow.department,
          roleRequiredSkills: roleRow.required_skills ?? [],
          roleSkillRequirements: parseSkillRequirements(roleRow.skill_requirements),
          salaryMin: roleRow.salary_min,
          salaryMax: roleRow.salary_max,
        }
      : companyInput;

  const report =
    talentInput && scopedCompanyInput
      ? buildMatchReport(
          computeMatch(talentInput, scopedCompanyInput),
          talentInput,
          scopedCompanyInput,
          "talent",
        )
      : null;

  const companyName = companyInfo.get(match.company_id)?.name ?? "A company";

  return (
    <>
      <DashboardHeading>Opportunity</DashboardHeading>
      <TalentExchangeResponse
        matchId={matchId}
        candidateId={user.id}
        companyId={match.company_id}
        companyName={companyName}
        roleTitle={roleRow?.title ?? null}
        report={report}
        alreadyResponded={interest.candidate_interested !== null}
        status={interest.status}
      />
    </>
  );
}
