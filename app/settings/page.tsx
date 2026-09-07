import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { SignOutButton } from "@/components/settings/SignOutButton";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { requireShellUser } from "@/lib/dashboard/require-shell-user";

export default async function SettingsPage() {
  const { user, userRow, isCompany, shellAvatar, accountLabel } =
    await requireShellUser();
  const profileHref = isCompany ? "/company-profile/build" : "/profile/build";

  return (
    <DashboardShell
      userType={userRow.user_type}
      userId={user.id}
      title="Settings"
      searchPlaceholder={
        isCompany ? "Search candidates or roles" : "Search companies"
      }
      userSubtitle={isCompany ? "Recruiter" : "Talent"}
      {...shellAvatar}
    >
      <div className="flex max-w-lg flex-col gap-5">
        <div className="rounded-2xl border border-mingle-border bg-mingle-white p-7 shadow-mingle">
          <div>
            <p className="text-xs font-medium text-mingle-text-secondary">
              Signed in as
            </p>
            <p className="mt-1 text-sm font-semibold text-mingle-text">
              {user.email ?? accountLabel}
            </p>
          </div>
          <div className="mt-5">
            <p className="text-xs font-medium text-mingle-text-secondary">
              Path
            </p>
            <p className="mt-1 text-sm font-semibold text-mingle-text">
              {isCompany ? "Company" : "Talent"}
            </p>
          </div>
          <p className="mt-5 text-sm text-mingle-text-secondary">
            Notification preferences and workspace options will live here.
            For now you can edit your profile or sign out.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link href={profileHref} className="mingle-btn-primary text-xs">
              Edit profile
            </Link>
            <SignOutButton />
          </div>
        </div>
        <div className="rounded-2xl border border-mingle-border bg-mingle-white p-7 shadow-mingle">
          <ChangePasswordForm />
        </div>
      </div>
    </DashboardShell>
  );
}
