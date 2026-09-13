import Link from "next/link";
import { MingleLogo } from "@/components/MingleLogo";

/**
 * Minimal top chrome for full-screen profile build wizards so users
 * always have a way back into the app shell (Dashboard).
 */
export function ProfileBuildChrome({
  homeHref = "/dashboard",
  homeLabel = "Back to dashboard",
}: {
  homeHref?: string;
  homeLabel?: string;
}) {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
      <Link
        href={homeHref}
        className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-mingle-border bg-mingle-surface/95 px-3 py-1.5 text-xs font-medium text-mingle-text shadow-sm backdrop-blur transition-colors hover:bg-mingle-lavender"
      >
        <MingleLogo variant="mark" size={22} />
        <span className="hidden sm:inline">{homeLabel}</span>
        <span className="sm:hidden">Dashboard</span>
      </Link>
    </header>
  );
}
