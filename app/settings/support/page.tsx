import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { SupportForm } from "@/components/settings/SupportForm";
import { requireShellUser } from "@/lib/dashboard/require-shell-user";

export default async function SupportPage() {
  const { user, userRow, isCompany, shellAvatar, accountLabel } =
    await requireShellUser();

  return (
    <DashboardShell
      userType={userRow.user_type}
      userId={user.id}
      title="Support"
      searchPlaceholder={
        isCompany ? "Search candidates or roles" : "Search companies"
      }
      userSubtitle={isCompany ? "Recruiter" : "Talent"}
      {...shellAvatar}
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <Link
          href="/settings"
          className="text-xs font-semibold text-mingle-text-secondary hover:text-mingle-text"
        >
          ← Back to settings
        </Link>
        <SupportForm userEmail={user.email ?? accountLabel} />
      </div>
    </DashboardShell>
  );
}
