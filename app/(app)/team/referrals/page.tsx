import { DashboardHeading } from "@/components/dashboard/DashboardHeading";
import { ReferralsScreen } from "@/components/team/ReferralsScreen";
import { requireAppUser } from "@/lib/dashboard/require-shell-user";
import { resolveCompanyWorkspaceId } from "@/lib/team/persistence";
import { loadCompanyRoles } from "@/lib/roles/persistence";
import { loadReferralsForCompany } from "@/lib/referrals/persistence";
import { appOrigin } from "@/lib/app-origin";

export default async function TeamReferralsPage() {
  const { supabase, user } = await requireAppUser({ userType: "company" });

  const companyId = await resolveCompanyWorkspaceId(supabase, user.id);
  const canManage = companyId === user.id;

  const [allRoles, referrals] = await Promise.all([
    loadCompanyRoles(supabase, companyId),
    loadReferralsForCompany(supabase, companyId),
  ]);
  const openRoles = allRoles
    .filter((role) => role.status === "open")
    .map((role) => ({ id: role.id, title: role.title }));

  return (
    <>
      <DashboardHeading>Referrals</DashboardHeading>
      <ReferralsScreen
        roles={openRoles}
        initialReferrals={referrals}
        currentUserId={user.id}
        companyId={companyId}
        canManage={canManage}
        origin={appOrigin()}
      />
    </>
  );
}
