import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { MingleChip } from "@/components/MingleChip";
import { requireShellUser } from "@/lib/dashboard/require-shell-user";
import { toCompanyProfile } from "@/lib/profile-detail/adapters";

export default async function RolesPage() {
  const { supabase, user, accountLabel, initials } = await requireShellUser({
    userType: "company",
  });

  const { data: profileRow } = await supabase
    .from("company_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  const profile = profileRow ? toCompanyProfile(profileRow) : null;
  const lookingFor = profile?.lookingFor.filter(Boolean) ?? [];

  return (
    <DashboardShell
      userType="company"
      userId={user.id}
      title="Roles"
      searchPlaceholder="Search candidates or roles"
      userName={accountLabel}
      userInitials={initials}
      userSubtitle="Recruiter"
    >
      <div className="flex flex-col gap-6">
        <p className="max-w-xl text-sm leading-relaxed text-mingle-text-secondary">
          Open roles you are hiring for. For now they come from what you
          already wrote on your company profile.
        </p>

        {lookingFor.length > 0 ? (
          <div className="rounded-2xl border border-mingle-border bg-mingle-white p-6 shadow-mingle">
            <h2 className="font-display text-base font-semibold tracking-tight text-mingle-text">
              {profile?.companyName
                ? `What ${profile.companyName} is looking for`
                : "What you are looking for"}
            </h2>
            {profile?.industry ? (
              <p className="mt-1 text-xs text-mingle-text-secondary">
                {profile.industry}
                {profile.location ? ` · ${profile.location}` : ""}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {lookingFor.map((item) => (
                <MingleChip key={item}>{item}</MingleChip>
              ))}
            </div>
            <Link
              href="/company-profile/build"
              className="mingle-btn-secondary mt-6 inline-block text-xs"
            >
              Edit on company profile
            </Link>
          </div>
        ) : (
          <EmptyState
            title="No open roles yet"
            body="Add who you are looking for on your company profile. That list will show up here so candidates have a clear picture of the roles you care about."
            actionHref="/company-profile/build"
            actionLabel="Add who you are looking for"
          />
        )}
      </div>
    </DashboardShell>
  );
}
