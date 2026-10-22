import Link from "next/link";

/**
 * Shown instead of a feature the company's plan doesn't include. Never hides
 * data — it only explains what unlocks it and links to the billing page.
 */
export function UpgradeLock({
  title,
  body,
  planLabel,
}: {
  title: string;
  body: string;
  planLabel: "Plus" | "Max";
}) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-mingle-border bg-mingle-surface p-7 text-center shadow-mingle">
      <span aria-hidden className="text-2xl">
        🔒
      </span>
      <h2 className="mt-3 font-display text-lg font-semibold text-mingle-text">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-mingle-text-secondary">{body}</p>
      <p className="mt-2 text-xs font-semibold text-mingle-purple">Included in {planLabel} and above</p>
      <Link href="/billing" className="mingle-btn-primary mt-5 inline-block text-sm">
        See plans
      </Link>
    </div>
  );
}
