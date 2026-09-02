import Link from "next/link";
import {
  discoveryQueryString,
  type DiscoveryFilters,
} from "@/lib/discovery/filters";

const fieldClass =
  "w-full rounded-xl border border-mingle-border bg-mingle-bg px-3 py-2.5 text-sm text-mingle-white placeholder:text-mingle-text-secondary focus:border-mingle-purple focus:outline-none";

export function DiscoveryFiltersForm({
  filters,
  styleOptions,
}: {
  filters: DiscoveryFilters;
  styleOptions: string[];
}) {
  return (
    <form
      action="/discover"
      method="get"
      className="rounded-2xl border border-mingle-border bg-mingle-surface p-4 sm:p-5"
    >
      <p className="text-sm font-medium text-mingle-white">
        Narrow who you see
      </p>
      <p className="mt-1 text-xs text-mingle-text-secondary">
        Filters run on the server before match scores. The engine itself does
        not change.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5 text-xs font-medium text-mingle-text-secondary">
          Industry
          <input
            type="search"
            name="industry"
            defaultValue={filters.industry}
            placeholder="Technology"
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-mingle-text-secondary">
          Location
          <input
            type="search"
            name="location"
            defaultValue={filters.location}
            placeholder="Tel Aviv"
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-medium text-mingle-text-secondary">
          Work style
          <select name="style" defaultValue={filters.style} className={fieldClass}>
            <option value="">Any</option>
            {styleOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="cursor-pointer rounded-full bg-mingle-cta px-5 py-2.5 font-display text-xs font-semibold text-mingle-white"
        >
          Apply filters
        </button>
        <Link
          href="/discover"
          className="cursor-pointer rounded-full px-5 py-2.5 font-display text-xs font-semibold text-mingle-text-secondary hover:text-mingle-white"
        >
          Clear
        </Link>
      </div>
    </form>
  );
}

export function DiscoveryPagination({
  filters,
  total,
  pageSize,
}: {
  filters: DiscoveryFilters;
  total: number;
  pageSize: number;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(filters.page, pageCount);
  if (total <= pageSize) return null;

  return (
    <div className="flex items-center justify-between gap-3">
      {page > 1 ? (
        <Link
          href={discoveryQueryString(filters, page - 1)}
          className="cursor-pointer rounded-full bg-mingle-surface px-5 py-2.5 font-display text-xs font-semibold text-mingle-white"
        >
          Previous
        </Link>
      ) : (
        <span />
      )}
      <p className="text-xs text-mingle-text-secondary">
        Page {page} of {pageCount}
      </p>
      {page < pageCount ? (
        <Link
          href={discoveryQueryString(filters, page + 1)}
          className="cursor-pointer rounded-full bg-mingle-surface px-5 py-2.5 font-display text-xs font-semibold text-mingle-white"
        >
          Next
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
