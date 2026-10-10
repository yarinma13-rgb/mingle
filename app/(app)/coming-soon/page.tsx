import Link from "next/link";
import { NotifyMeButton } from "@/components/plans/NotifyMeButton";
import { DashboardHeading } from "@/components/dashboard/DashboardHeading";

export default function ComingSoonPage() {
  return (
    <>
      <DashboardHeading>Coming soon</DashboardHeading>
      <div className="max-w-lg rounded-2xl border border-mingle-border bg-mingle-surface p-7 shadow-mingle">
        <p className="text-sm leading-relaxed text-mingle-text-secondary">
          Pricing is coming soon. We&apos;ll share plans here when they&apos;re
          ready — nothing to buy on this page yet.
        </p>
        <NotifyMeButton />
        <Link href="/dashboard" className="mingle-btn-secondary mt-3 inline-block text-xs">
          Back to dashboard
        </Link>
      </div>
    </>
  );
}
