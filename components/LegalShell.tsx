import Link from "next/link";
import { MingleLogo } from "@/components/MingleLogo";

export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-1 flex-col bg-mingle-bg px-4 py-10 sm:px-10 sm:py-12">
      <div className="mx-auto w-full max-w-2xl">
        <Link href="/" className="inline-flex">
          <MingleLogo variant="lockup" size={28} />
        </Link>
        <p className="mt-10 text-xs font-semibold uppercase tracking-[0.16em] text-mingle-text-secondary">
          Last updated {updated}
        </p>
        <h1 className="mt-3 font-display text-2xl font-bold text-mingle-white sm:text-3xl">
          {title}
        </h1>
        <div className="mt-8 flex flex-col gap-6 break-words text-sm leading-relaxed text-mingle-text-secondary [&_h2]:mt-2 [&_h2]:font-display [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-mingle-white [&_a]:text-mingle-white [&_a]:underline [&_a]:underline-offset-2">
          {children}
        </div>
        <p className="mt-12 text-xs text-mingle-text-secondary">
          <Link href="/legal/terms">Terms of Service</Link>
          {" · "}
          <Link href="/legal/privacy">Privacy Policy</Link>
          {" · "}
          <Link href="/">Back to mingle</Link>
        </p>
      </div>
    </main>
  );
}
