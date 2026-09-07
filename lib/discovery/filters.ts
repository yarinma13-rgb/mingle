export const DISCOVERY_PAGE_SIZE = 12;

/** Applied server-side so a 5-year filter still returns strong 3–4 year profiles. */
export const EXPERIENCE_TOLERANCE_YEARS = 2;

export const WORK_MODEL_OPTIONS = ["Remote", "Hybrid", "Office based"] as const;
export type WorkModelOption = (typeof WORK_MODEL_OPTIONS)[number];

export type DiscoveryFilters = {
  industry: string;
  location: string;
  style: string;
  role: string;
  workModel: string;
  yearsMin: number | null;
  yearsMax: number | null;
  values: string[];
  page: number;
};

function oneValue(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return (raw ?? "").trim().slice(0, 80);
}

function manyValues(value: string | string[] | undefined): string[] {
  const raw = Array.isArray(value) ? value : value ? [value] : [];
  const seen = new Set<string>();
  for (const entry of raw) {
    for (const piece of entry.split(",")) {
      const next = piece.trim().slice(0, 80);
      if (next) seen.add(next);
    }
  }
  return [...seen].slice(0, 20);
}

function optionalYear(value: string | string[] | undefined): number | null {
  const raw = Number.parseInt(oneValue(value), 10);
  if (!Number.isFinite(raw) || raw <= 0) return null;
  return Math.min(40, raw);
}

export function isWorkModelOption(value: string): value is WorkModelOption {
  return (WORK_MODEL_OPTIONS as readonly string[]).includes(value);
}

export function parseDiscoveryFilters(
  searchParams: Record<string, string | string[] | undefined>,
): DiscoveryFilters {
  const pageRaw = Number.parseInt(oneValue(searchParams.page), 10);
  const workModel = oneValue(searchParams.workModel);
  return {
    industry: oneValue(searchParams.industry),
    location: oneValue(searchParams.location),
    style: oneValue(searchParams.style),
    role: oneValue(searchParams.role),
    workModel: isWorkModelOption(workModel) ? workModel : "",
    yearsMin: optionalYear(searchParams.yearsMin),
    yearsMax: optionalYear(searchParams.yearsMax),
    values: manyValues(searchParams.values),
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1,
  };
}

export function discoveryFiltersActive(filters: DiscoveryFilters): boolean {
  return Boolean(
    filters.industry ||
      filters.location ||
      filters.style ||
      filters.role ||
      filters.workModel ||
      filters.yearsMin ||
      filters.yearsMax ||
      filters.values.length,
  );
}

export function discoveryActiveFilterCount(filters: DiscoveryFilters): number {
  return [
    filters.industry,
    filters.location,
    filters.style,
    filters.role,
    filters.workModel,
    filters.yearsMin,
    filters.yearsMax,
    filters.values.length ? "values" : "",
  ].filter(Boolean).length;
}

export function discoveryQueryString(
  filters: DiscoveryFilters,
  page = filters.page,
): string {
  const params = new URLSearchParams();
  if (filters.industry) params.set("industry", filters.industry);
  if (filters.location) params.set("location", filters.location);
  if (filters.style) params.set("style", filters.style);
  if (filters.role) params.set("role", filters.role);
  if (filters.workModel) params.set("workModel", filters.workModel);
  if (filters.yearsMin) params.set("yearsMin", String(filters.yearsMin));
  if (filters.yearsMax) params.set("yearsMax", String(filters.yearsMax));
  for (const value of filters.values) params.append("values", value);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/discover?${query}` : "/discover";
}

export function sanitizeIlike(term: string): string {
  return term.replace(/[%_,]/g, " ").replace(/\s+/g, " ").trim();
}
