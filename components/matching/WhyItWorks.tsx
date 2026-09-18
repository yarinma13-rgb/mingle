/** Compact “Why it works” list under a Match Score. */
export function WhyItWorks({
  reasons,
  title = "Why it works",
  tone = "light",
  max = 4,
}: {
  reasons: string[];
  title?: string;
  tone?: "light" | "onDark";
  max?: number;
}) {
  const items = reasons.filter(Boolean).slice(0, max);
  if (items.length === 0) return null;

  const titleClass =
    tone === "onDark"
      ? "text-white/70"
      : "text-mingle-text-secondary";
  const itemClass =
    tone === "onDark" ? "text-white/90" : "text-mingle-text";
  const checkClass =
    tone === "onDark" ? "text-[#F9A8C9]" : "text-mingle-accent-purple";

  return (
    <div className="flex flex-col gap-1.5">
      <p
        className={`text-[11px] font-semibold uppercase tracking-[0.1em] ${titleClass}`}
      >
        {title}
      </p>
      <ul className="flex flex-col gap-1">
        {items.map((reason) => (
          <li
            key={reason}
            className={`flex items-start gap-2 text-[13px] leading-snug ${itemClass}`}
          >
            <span aria-hidden className={`mt-0.5 shrink-0 font-bold ${checkClass}`}>
              ✓
            </span>
            <span className="min-w-0">{reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
