import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { requireShellUser } from "@/lib/dashboard/require-shell-user";

export default async function InterviewsPage() {
  const { user, accountLabel, initials } = await requireShellUser({
    userType: "company",
  });

  return (
    <DashboardShell
      userType="company"
      userId={user.id}
      title="Interviews"
      searchPlaceholder="Search candidates or roles"
      userName={accountLabel}
      userInitials={initials}
      userSubtitle="Recruiter"
    >
      <div className="flex flex-col gap-6">
        <p className="max-w-xl text-sm leading-relaxed text-mingle-text-secondary">
          Scheduled conversations with candidates. Nothing sits here until
          you start connecting.
        </p>
        <EmptyState
          title="No interviews scheduled yet"
          body="When a relationship reaches a conversation, you can plan the next step from there. Upcoming interviews will appear on this page."
          actionHref="/discover"
          actionLabel="Find candidates"
        />
      </div>
    </DashboardShell>
  );
}
