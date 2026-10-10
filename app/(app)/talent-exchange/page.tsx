import { redirect } from "next/navigation";
import { DashboardHeading } from "@/components/dashboard/DashboardHeading";
import { TalentExchangeScreen } from "@/components/talent-exchange/TalentExchangeScreen";
import { requireAppUser } from "@/lib/dashboard/require-shell-user";
import { resolveCompanyWorkspaceId } from "@/lib/team/persistence";
import { findTalentExchangeCandidatesForCompany } from "@/lib/talent-exchange/recommendations";
import { buildAnonymousCandidateCard, type AnonymousCandidateCard } from "@/lib/talent-exchange/anonymize";

export default async function TalentExchangePage() {
  const { supabase, user, userRow } = await requireAppUser();
  if (userRow.user_type !== "company") redirect("/dashboard");

  const companyId = await resolveCompanyWorkspaceId(supabase, user.id);
  const matches = await findTalentExchangeCandidatesForCompany(supabase, companyId);

  const cards = (
    await Promise.all(
      matches.map((match) =>
        buildAnonymousCandidateCard(
          supabase,
          match.candidateId,
          match.role,
          match.visibilityStatus,
        ),
      ),
    )
  ).filter((card): card is AnonymousCandidateCard => card !== null);

  const matchIds = cards.map((card) => card.matchId);
  const { data: interestRows } = matchIds.length > 0
    ? await supabase
        .from("talent_exchange_interest")
        .select("match_id, company_interested")
        .in("match_id", matchIds)
    : { data: [] as { match_id: string; company_interested: boolean }[] };
  const alreadyInterestedByMatch = new Map(
    (interestRows ?? []).map((row) => [row.match_id, row.company_interested]),
  );

  return (
    <>
      <DashboardHeading>Talent Exchange</DashboardHeading>
      <TalentExchangeScreen
        cards={cards}
        alreadyInterestedByMatch={Object.fromEntries(alreadyInterestedByMatch)}
      />
    </>
  );
}
