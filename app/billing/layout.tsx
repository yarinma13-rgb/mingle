import Link from "next/link";
import { MingleLogo } from "@/components/MingleLogo";

/** Standalone (outside the app shell) so the billing gate can't redirect to itself. */
export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-mingle-bg">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/dashboard" aria-label="mingle home">
          <MingleLogo />
        </Link>
        <Link href="/dashboard" className="text-sm font-medium text-mingle-text-secondary hover:text-mingle-text">
          Back to app
        </Link>
      </header>
      <main className="mx-auto max-w-6xl px-6 pb-16">{children}</main>
    </div>
  );
}
