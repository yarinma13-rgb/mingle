import Link from "next/link";
import { DashboardHeading } from "@/components/dashboard/DashboardHeading";
import { SupportForm } from "@/components/settings/SupportForm";
import { requireAppUser } from "@/lib/dashboard/require-shell-user";

export default async function SupportPage() {
  const { user, accountLabel } = await requireAppUser();

  return (
    <>
      <DashboardHeading>Support</DashboardHeading>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <Link
          href="/settings"
          className="text-xs font-semibold text-mingle-text-secondary hover:text-mingle-text"
        >
          ← Back to settings
        </Link>
        <SupportForm userEmail={user.email ?? accountLabel} />
      </div>
    </>
  );
}
