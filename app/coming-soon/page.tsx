import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { requireShellUser } from "@/lib/dashboard/require-shell-user";

export default async function ComingSoonPage() {
  const { user, userRow, isCompany, shellAvatar } = await requireShellUser();

  return (
    <DashboardShell
      userType={userRow.user_type}
      userId={user.id}
      title="Coming soon"
      searchPlaceholder={
        isCompany ? "Search candidates or roles" : "Search companies"
      }
      userSubtitle={isCompany ? "Recruiter" : "Talent"}
      {...shellAvatar}
    >
      <div className="max-w-lg rounded-2xl border border-mingle-border bg-mingle-surface p-7 shadow-mingle">
        <p className="text-sm leading-relaxed text-mingle-text-secondary">
          Plans are not for sale here yet. This page is a placeholder until
          billing lives in its own project.
        </p>
        <Link href="/dashboard" className="mingle-btn-primary mt-6 inline-block text-xs">
          Back to dashboard
        </Link>
      </div>
    </DashboardShell>
  );
}
