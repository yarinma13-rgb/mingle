import Link from "next/link";

export function AdminShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-mingle-text-secondary">
            Internal
          </p>
          <h1 className="font-display text-xl font-semibold tracking-tight text-mingle-text">
            {title}
          </h1>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/admin/matches" className="text-mingle-purple underline-offset-2 hover:underline">
            Match review
          </Link>
          <Link href="/dashboard" className="text-mingle-text-secondary underline-offset-2 hover:underline">
            Back to dashboard
          </Link>
        </div>
      </div>
      {children}
    </main>
  );
}
