"use client";

import { useState } from "react";
import Link from "next/link";
import { CustomChipInput } from "@/components/CustomChipInput";
import { DistanceSlider } from "@/components/DistanceSlider";
import {
  addCustomCapped,
  extraChipValues,
} from "@/lib/profile/pick-limit";
import {
  discoveryActiveFilterCount,
  WORK_MODEL_OPTIONS,
  discoveryQueryString,
  type DiscoveryFilters,
} from "@/lib/discovery/filters";

const fieldClass =
  "w-full rounded-xl border border-mingle-border bg-mingle-bg px-3 py-2.5 text-sm text-mingle-text placeholder:text-mingle-text-secondary focus:border-mingle-blue focus:outline-none";

export function DiscoveryFiltersForm({
  filters,
  styleOptions,
  valueOptions = [],
  audience,
  formAction = "/discover",
}: {
  filters: DiscoveryFilters;
  styleOptions: string[];
  valueOptions?: string[];
  audience: "company" | "talent";
  formAction?: string;
}) {
  const [open, setOpen] = useState(false);
  const [yearsMin, setYearsMin] = useState(filters.yearsMin ?? 0);
  const [yearsMax, setYearsMax] = useState(filters.yearsMax ?? 0);
  const [distanceKm, setDistanceKm] = useState(filters.distanceKm ?? 0);
  const [customValues, setCustomValues] = useState(() =>
    extraChipValues(filters.values, valueOptions),
  );
  const activeCount = discoveryActiveFilterCount(filters);
  const isCompany = audience === "company";

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mingle-btn-secondary cursor-pointer text-xs"
      >
        Filters{activeCount > 0 ? ` · ${activeCount}` : ""}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <form
            action={formAction}
            method="get"
            onClick={(event) => event.stopPropagation()}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-mingle-border bg-mingle-surface p-5 shadow-mingle"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-mingle-text">
                  Narrow who you see
                </p>
                <p className="mt-1 text-xs text-mingle-text-secondary">
                  Filters run on the server before match scores. The engine
                  itself does not change.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs font-semibold text-mingle-text-secondary hover:text-mingle-text"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
              {isCompany ? (
                <label className="flex flex-col gap-1.5 text-xs font-medium text-mingle-text-secondary sm:col-span-2">
                  Role or title
                  <input
                    type="search"
                    name="role"
                    defaultValue={filters.role}
                    placeholder="Product designer"
                    className={fieldClass}
                  />
                </label>
              ) : null}
              <label className="flex flex-col gap-1.5 text-xs font-medium text-mingle-text-secondary">
                Work style
                <select
                  name="style"
                  defaultValue={filters.style}
                  className={fieldClass}
                >
                  <option value="">Any</option>
                  {styleOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              {isCompany ? (
                <label className="flex flex-col gap-1.5 text-xs font-medium text-mingle-text-secondary">
                  Work model
                  <select
                    name="workModel"
                    defaultValue={filters.workModel}
                    className={fieldClass}
                  >
                    <option value="">No preference</option>
                    {WORK_MODEL_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>

            {isCompany ? (
              <>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5 text-xs font-medium text-mingle-text-secondary">
                    Min years
                    <input
                      type="range"
                      name="yearsMin"
                      min={0}
                      max={20}
                      value={yearsMin}
                      onChange={(event) =>
                        setYearsMin(Number.parseInt(event.target.value, 10) || 0)
                      }
                      className="accent-mingle-accent-purple"
                    />
                    <span>
                      {yearsMin
                        ? `${yearsMin}+ (includes about 2 years below)`
                        : "Any"}
                    </span>
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs font-medium text-mingle-text-secondary">
                    Max years
                    <input
                      type="range"
                      name="yearsMax"
                      min={0}
                      max={20}
                      value={yearsMax}
                      onChange={(event) =>
                        setYearsMax(Number.parseInt(event.target.value, 10) || 0)
                      }
                      className="accent-mingle-accent-blue"
                    />
                    <span>
                      {yearsMax
                        ? `Up to ${yearsMax} (includes about 2 years above)`
                        : "Any"}
                    </span>
                  </label>
                </div>

                <fieldset className="mt-4">
                    <legend className="text-xs font-medium text-mingle-text-secondary">
                      Values overlap
                    </legend>
                    <p className="mt-1 text-xs text-mingle-text-secondary">
                      Keep candidates whose top values include any of these.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {[...valueOptions, ...customValues].map((option) => (
                        <label
                          key={option}
                          className="inline-flex items-center gap-1.5 rounded-full border border-mingle-border bg-mingle-bg px-3 py-1.5 text-xs text-mingle-text"
                        >
                          <input
                            type="checkbox"
                            name="values"
                            value={option}
                            defaultChecked={filters.values.includes(option)}
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                    <CustomChipInput
                      onAdd={(value) =>
                        setCustomValues((prev) =>
                          addCustomCapped(prev, value, 20, valueOptions),
                        )
                      }
                    />
                  </fieldset>

                <div className="mt-4">
                  <DistanceSlider
                    value={distanceKm}
                    onChange={setDistanceKm}
                    label="Distance in km"
                    hint={
                      distanceKm
                        ? `Up to ${distanceKm} km. Profiles without coordinates still appear.`
                        : "Any. Profiles without coordinates are not dropped."
                    }
                  />
                </div>
              </>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="mingle-btn-primary cursor-pointer text-xs"
              >
                Apply filters
              </button>
              <Link
                href="/discover"
                className="cursor-pointer rounded-full px-5 py-2.5 font-display text-xs font-semibold text-mingle-text-secondary hover:text-mingle-text"
              >
                Clear
              </Link>
            </div>
          </form>
        </div>
      ) : null}
    </div>
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
          className="mingle-btn-secondary cursor-pointer text-xs"
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
          className="mingle-btn-secondary cursor-pointer text-xs"
        >
          Next
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
