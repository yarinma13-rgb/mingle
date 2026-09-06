import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { SignOutButton } from "@/components/settings/SignOutButton";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: userRow } = await supabase
    .from("users")
    .select("user_type")
    .eq("id", user.id)
    .maybeSingle();
  if (!userRow) redirect("/auth");

  const accountLabel = user.email?.split("@")[0] ?? "You";
  const initials = accountLabel.slice(0, 2).toUpperCase();
  const isCompany = userRow.user_type === "company";
  const profileHref = isCompany ? "/company-profile/build" : "/profile/build";

  return (
    <DashboardShell
      userType={userRow.user_type}
      userId={user.id}
      title="Settings"
      searchPlaceholder={
        isCompany ? "Search candidates or roles" : "Search companies"
      }
      userName={accountLabel}
      userInitials={initials}
      userSubtitle={isCompany ? "Recruiter" : "Talent"}
    >
      <div className="flex max-w-lg flex-col gap-5 rounded-2xl border border-mingle-border bg-mingle-white p-7 shadow-mingle">
        <div>
          <p className="text-xs font-medium text-mingle-text-secondary">
            Signed in as
          </p>
          <p className="mt-1 text-sm font-semibold text-mingle-text">
            {user.email}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-mingle-text-secondary">
            Path
          </p>
          <p className="mt-1 text-sm font-semibold text-mingle-text">
            {isCompany ? "Company" : "Talent"}
          </p>
        </div>
        <p className="text-sm text-mingle-text-secondary">
          Notification preferences and workspace options will live here.
          For now you can edit your profile or sign out.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Link href={profileHref} className="mingle-btn-primary text-xs">
            Edit profile
          </Link>
          <SignOutButton />
        </div>
      </div>
    </DashboardShell>
  );
}
