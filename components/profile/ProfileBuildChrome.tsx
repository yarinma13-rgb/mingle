import Link from "next/link";
import { MingleLogo } from "@/components/MingleLogo";

/**
 * Top chrome for full-screen profile build wizards.
 * Keeps a way back into the app (and a couple of primary destinations)
 * so "My profile" never feels like a dead-end with only browser back.
 */
export function ProfileBuildChrome({
  homeHref = "/dashboard",
  homeLabel = "Back to dashboard",
  links = [
    { href: "/discover", label: "Discover" },
    { href: "/conversations", label: "Conversations" },
    { href: "/settings", label: "Settings" },
  ],
}: {
  homeHref?: string;
  homeLabel?: string;
  links?: { href: string; label: string }[];
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
      <nav className="pointer-events-auto hidden items-center gap-1 rounded-full border border-mingle-border bg-mingle-surface/95 p-1 shadow-sm backdrop-blur sm:flex">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-full px-3 py-1.5 text-xs font-medium text-mingle-text-secondary transition-colors hover:bg-mingle-lavender hover:text-mingle-text"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
