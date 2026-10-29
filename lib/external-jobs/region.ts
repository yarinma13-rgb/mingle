import type { RawJob } from "@/lib/external-jobs/types";

/**
 * Which countries a job is in, and whether that's somewhere mingle lists
 * jobs. Structured country fields from the source win; the location text is
 * the fallback. A job counts when any of its locations is in a target
 * country. Unknown (e.g. plain "Remote") is not in any target.
 */

export type CountryCode = "US" | "IL" | string;

/** Target countries: EXTERNAL_JOBS_COUNTRIES="US,IL" (the default). */
export function targetCountries(): CountryCode[] {
  const raw = process.env.EXTERNAL_JOBS_COUNTRIES?.trim();
  const list = (raw ? raw.split(",") : ["US", "IL"]).map((c) => c.trim().toUpperCase()).filter(Boolean);
  return list.length ? list : ["US", "IL"];
}

const COUNTRY_NAMES: Record<string, CountryCode> = {
  "united states": "US",
  "united states of america": "US",
  usa: "US",
  us: "US",
  "u.s.": "US",
  "u.s.a.": "US",
  america: "US",
  israel: "IL",
  il: "IL",
  isr: "IL",
  "ישראל": "IL",
};

export function normalizeCountry(value: string | null | undefined): CountryCode | null {
  const key = (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  if (!key) return null;
  if (COUNTRY_NAMES[key]) return COUNTRY_NAMES[key];
  return key.length === 2 ? key.toUpperCase() : key;
}

const US_STATES = [
  "alabama", "alaska", "arizona", "arkansas", "california", "colorado", "connecticut", "delaware",
  "florida", "georgia", "hawaii", "idaho", "illinois", "indiana", "iowa", "kansas", "kentucky",
  "louisiana", "maine", "maryland", "massachusetts", "michigan", "minnesota", "mississippi",
  "missouri", "montana", "nebraska", "nevada", "new hampshire", "new jersey", "new mexico",
  "new york", "north carolina", "north dakota", "ohio", "oklahoma", "oregon", "pennsylvania",
  "rhode island", "south carolina", "south dakota", "tennessee", "texas", "utah", "vermont",
  "virginia", "washington", "west virginia", "wisconsin", "wyoming", "district of columbia",
];
const US_STATE_CODES = new Set(
  "AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC".split(" "),
);
const US_CITIES = [
  "new york", "nyc", "san francisco", "los angeles", "seattle", "austin", "boston", "chicago",
  "denver", "atlanta", "miami", "washington, d.c", "washington dc", "san jose", "san diego",
  "palo alto", "mountain view", "menlo park", "sunnyvale", "redwood city", "oakland", "portland",
  "philadelphia", "pittsburgh", "dallas", "houston", "phoenix", "salt lake city", "nashville",
  "raleigh", "minneapolis", "detroit", "brooklyn", "jersey city", "cambridge, ma", "bay area",
];
const IL_PLACES = [
  "tel aviv", "tel-aviv", "jerusalem", "haifa", "herzliya", "herzlia", "ramat gan", "petah tikva",
  "petach tikva", "beer sheva", "be'er sheva", "beersheba", "netanya", "rehovot", "ra'anana",
  "raanana", "yokneam", "caesarea", "hod hasharon", "kfar saba", "modiin", "modi'in", "rosh haayin",
  "rosh ha'ayin", "airport city", "or yehuda", "bnei brak", "givatayim", "holon", "rishon lezion",
  "ashdod", "nazareth", "תל אביב", "ירושלים", "חיפה", "הרצליה", "רמת גן", "פתח תקווה", "באר שבע",
];

function includesWord(text: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^\\p{L}])${escaped}($|[^\\p{L}])`, "iu").test(text);
}

/** Countries named or implied by free-text locations ("Remote, Canada; Remote, US"). */
export function countriesFromText(location: string | null | undefined): Set<CountryCode> {
  const found = new Set<CountryCode>();
  if (!location) return found;
  for (const part of location.split(/[;|/]|\n/)) {
    const text = part.trim();
    if (!text) continue;
    const lower = text.toLowerCase();
    if (/\b(israel|isr)\b|ישראל/i.test(text) || IL_PLACES.some((p) => includesWord(lower, p))) found.add("IL");
    if (
      /\b(united states|usa|u\.s\.a?\.?|north america)\b/i.test(text) ||
      /(^|[\s,(])US($|[\s,)])/.test(text) ||
      US_STATES.some((s) => includesWord(lower, s)) ||
      US_CITIES.some((c) => includesWord(lower, c)) ||
      [...text.matchAll(/,\s*([A-Z]{2})\b/g)].some((m) => US_STATE_CODES.has(m[1]) && !/\b(ON|BC|QC|AB)\b/.test(m[1]))
    ) {
      found.add("US");
    }
    // Any other explicit country after a comma ("Dublin, Ireland") is recorded
    // so the job is known to be elsewhere rather than unknown.
    const tail = text.split(",").pop()?.replace(/[()]/g, "").trim().toLowerCase();
    if (tail && !found.size && tail.length > 2 && !/remote|hybrid|on-?site|anywhere/.test(tail)) {
      found.add(tail);
    }
  }
  return found;
}

export function jobCountries(raw: Pick<RawJob, "location" | "countries">): Set<CountryCode> {
  const found = countriesFromText(raw.location);
  for (const country of raw.countries ?? []) {
    const code = normalizeCountry(country);
    if (code) found.add(code);
  }
  return found;
}

export function inTargetRegion(
  raw: Pick<RawJob, "location" | "countries">,
  targets: CountryCode[] = targetCountries(),
): boolean {
  const countries = jobCountries(raw);
  return targets.some((t) => countries.has(t));
}
