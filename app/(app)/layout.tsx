import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { requireShellUser } from "@/lib/dashboard/require-shell-user";

/**
 * Persistent chrome for logged-in product routes. Keeps sidebar / header /
 * bottom nav mounted across category navigations so only page content
 * suspends into loading.tsx.
 */
export default async function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userRow, isCompany, shellAvatar } = await requireShellUser();

  return (
    <DashboardShell
      userType={userRow.user_type}
      userId={user.id}
      searchPlaceholder={
        isCompany ? "Search candidates or roles" : "Search companies"
      }
      userSubtitle={isCompany ? "Recruiter" : "Talent"}
      {...shellAvatar}
    >
      {children}
    </DashboardShell>
  );
}
