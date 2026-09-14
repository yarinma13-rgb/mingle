import { DashboardHeading } from "@/components/dashboard/DashboardHeading";
import { PasteJobScreen } from "@/components/roles/PasteJobScreen";
import { requireAppUser } from "@/lib/dashboard/require-shell-user";

export default async function PasteRolePage() {
  const { user } = await requireAppUser({
    userType: "company",
  });

  return (
    <>
      <DashboardHeading>Roles</DashboardHeading>
      <PasteJobScreen companyId={user.id} />
    </>
  );
}
