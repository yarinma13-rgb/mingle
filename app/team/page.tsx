import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { requireShellUser } from "@/lib/dashboard/require-shell-user";
import { Avatar } from "@/components/Avatar";

export default async function TeamPage() {
  const { user, accountLabel, shellAvatar } = await requireShellUser({
    userType: "company",
  });

  return (
    <DashboardShell
      userType="company"
      userId={user.id}
      title="Team"
      searchPlaceholder="Search candidates or roles"
      userSubtitle="Recruiter"
      {...shellAvatar}
    >
      <div className="flex max-w-lg flex-col gap-6">
        <p className="text-sm leading-relaxed text-mingle-text-secondary">
          People who can hire from this workspace. You are the account holder
          for now.
        </p>
        <div className="rounded-2xl border border-mingle-border bg-mingle-white p-6 shadow-mingle">
          <h2 className="font-display text-base font-semibold tracking-tight text-mingle-text">
            Members
          </h2>
          <div className="mt-5 flex items-center gap-3">
            <Avatar
              photo={shellAvatar.userPhoto}
              initials={shellAvatar.userInitials}
              gender={shellAvatar.userGender}
              size="md"
            />
            <div>
              <p className="text-sm font-semibold text-mingle-text">
                {accountLabel}
              </p>
              <p className="text-xs text-mingle-text-secondary">
                You · Account holder
              </p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-relaxed text-mingle-text-secondary">
            Invite teammates once your workspace is ready. Until then,
            everything you do here stays on this account.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}
