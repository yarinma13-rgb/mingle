export type SalaryMarket = "il" | "us";

export type SalaryRangeDisplay = {
  market: SalaryMarket;
  period: "monthly" | "annual";
  labelHe: string;
  labelEn: string;
  low: string;
  high: string;
  periodHintHe: string;
  periodHintEn: string;
  locationHe: string;
  locationEn: string;
};

const IL_RANGE: SalaryRangeDisplay = {
  market: "il",
  period: "monthly",
  labelHe: "טווח שכר צפוי",
  labelEn: "Expected salary range",
  low: "₪25,000",
  high: "₪35,000",
  periodHintHe: "לחודש",
  periodHintEn: "/ month",
  locationHe: "תל אביב",
  locationEn: "Tel Aviv",
};

const US_RANGE: SalaryRangeDisplay = {
  market: "us",
  period: "annual",
  labelHe: "טווח שכר צפוי",
  labelEn: "Expected salary range",
  low: "$120,000",
  high: "$150,000",
  periodHintHe: "לשנה",
  periodHintEn: "/ year",
  locationHe: "ניו יורק",
  locationEn: "New York",
};

/** Israel → monthly ILS. US / default → annual USD. */
export function detectSalaryMarket(
  timeZone = "",
  languages: readonly string[] = [],
): SalaryMarket {
  const tz = timeZone.toLowerCase();
  if (
    tz === "asia/jerusalem" ||
    tz === "asia/tel_aviv" ||
    tz.includes("jerusalem")
  ) {
    return "il";
  }

  const langs = languages.map((lang) => lang.toLowerCase());
  if (
    langs.some(
      (lang) =>
        lang === "he" ||
        lang.startsWith("he-") ||
        lang.endsWith("-il") ||
        lang.includes("-il-"),
    )
  ) {
    return "il";
  }

  if (tz.startsWith("america/") || tz.startsWith("us/")) {
    return "us";
  }

  return "us";
}

export function salaryRangeForMarket(market: SalaryMarket): SalaryRangeDisplay {
  return market === "il" ? IL_RANGE : US_RANGE;
}

export function readClientSalaryMarket(): SalaryMarket {
  if (typeof window === "undefined") return "us";
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    const languages =
      typeof navigator !== "undefined"
        ? navigator.languages?.length
          ? navigator.languages
          : [navigator.language]
        : [];
    return detectSalaryMarket(timeZone, languages);
  } catch {
    return "us";
  }
}
