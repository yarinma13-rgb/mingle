import Link from "next/link";
import { ExternalBadge, OnMingleBadge } from "@/components/external-jobs/ExternalBadge";
import { EMPLOYMENT_LABELS, type JobCard } from "@/lib/external-jobs/candidate";
import { RECOMMENDED_THRESHOLD } from "@/lib/external-jobs/recommend";

/**
 * "Jobs that match you" strip for the talent Discover feed: the best
 * matching open roles (mingle companies and External Opportunities alike),
 * with a link to the full Jobs page.
 */
export function JobsForYou({ cards, seeAllHref }: { cards: JobCard[]; seeAllHref: string }) {
  if (cards.length === 0) return null;
  return (
    <section aria-labelledby="jobs-for-you" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="jobs-for-you" className="font-display text-base font-semibold text-mingle-text">
            Jobs that match you
          </h2>
          <p className="text-xs text-mingle-text-secondary">
            Open roles picked for your profile, from companies on mingle and official careers sites.
          </p>
        </div>
        <Link href={seeAllHref} prefetch className="text-sm font-semibold text-mingle-accent-purple hover:underline">
          See all jobs →
        </Link>
      </div>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <li
            key={card.key}
            className="flex flex-col gap-2 rounded-2xl border border-mingle-border bg-mingle-white p-4 shadow-mingle"
          >
            <div className="flex flex-wrap items-center gap-1.5">
              {card.origin === "external" ? <ExternalBadge /> : <OnMingleBadge />}
              {card.score >= RECOMMENDED_THRESHOLD ? (
                <span className="rounded-full bg-mingle-accent-pink/12 px-2 py-0.5 text-[11px] font-semibold text-mingle-pink-deep">
                  {card.score}% match
                </span>
              ) : null}
            </div>
            <Link href={card.href} prefetch className="group min-w-0">
              <p className="truncate font-display text-sm font-semibold text-mingle-text group-hover:underline" dir="auto">
                {card.title}
              </p>
              <p className="mt-0.5 truncate text-xs text-mingle-text-secondary">
                {[card.companyName, card.location, card.workModel, card.employmentType ? EMPLOYMENT_LABELS[card.employmentType] : null]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </Link>
            {card.score >= RECOMMENDED_THRESHOLD && card.reasons.length ? (
              <p className="line-clamp-2 text-[11px] text-mingle-text-secondary">{card.reasons.join(" · ")}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
