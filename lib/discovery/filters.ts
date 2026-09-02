export const DISCOVERY_PAGE_SIZE = 12;

export type DiscoveryFilters = {
  industry: string;
  location: string;
  style: string;
  page: number;
};

function oneValue(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return (raw ?? "").trim().slice(0, 80);
}

export function parseDiscoveryFilters(
  searchParams: Record<string, string | string[] | undefined>,
): DiscoveryFilters {
  const pageRaw = Number.parseInt(oneValue(searchParams.page), 10);
  return {
    industry: oneValue(searchParams.industry),
    location: oneValue(searchParams.location),
    style: oneValue(searchParams.style),
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1,
  };
}

export function discoveryQueryString(
  filters: DiscoveryFilters,
  page = filters.page,
): string {
  const params = new URLSearchParams();
  if (filters.industry) params.set("industry", filters.industry);
  if (filters.location) params.set("location", filters.location);
  if (filters.style) params.set("style", filters.style);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/discover?${query}` : "/discover";
}

export function sanitizeIlike(term: string): string {
  return term.replace(/[%_,]/g, " ").replace(/\s+/g, " ").trim();
}
