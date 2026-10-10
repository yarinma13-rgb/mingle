import { notFound } from "next/navigation";
import { DashboardHeading } from "@/components/dashboard/DashboardHeading";
import { RoleWorkspaceTabs } from "@/components/roles/RoleWorkspaceTabs";
import { requireAppUser } from "@/lib/dashboard/require-shell-user";
import { resolveCompanyWorkspaceId } from "@/lib/team/persistence";
import { loadCompanyRole } from "@/lib/roles/persistence";

export default async function RoleWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireAppUser({ userType: "company" });
  const companyId = await resolveCompanyWorkspaceId(supabase, user.id);

  const role = await loadCompanyRole(supabase, id, companyId);
  if (!role) notFound();

  return (
    <>
      <DashboardHeading>{role.title}</DashboardHeading>
      <div className="mb-6">
        <RoleWorkspaceTabs roleId={id} />
      </div>
      {children}
    </>
  );
}
