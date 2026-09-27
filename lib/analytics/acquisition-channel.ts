/**
 * Maps the three previously-siloed attribution signals (raw UTM params,
 * the outbound-interest outreach program, and the role-referral program)
 * onto one of the channels the founder actually reports against. Pure
 * function so it's easy to reason about / extend without touching the
 * three separate systems it reads from.
 */
export type AcquisitionChannel =
  | "linkedin"
  | "instagram"
  | "facebook"
  | "referral"
  | "company_outreach"
  | "organic"
  | "direct"
  | "other";

export function mapAcquisitionChannel(input: {
  utmSource?: string | null;
  utmMedium?: string | null;
  referrer?: string | null;
  hasReferral?: boolean;
}): { channel: AcquisitionChannel; raw: string | null } {
  const source = input.utmSource?.toLowerCase().trim() || "";
  const medium = input.utmMedium?.toLowerCase().trim() || "";
  const raw = input.utmSource?.trim() || input.referrer?.trim() || null;

  // A referral link takes priority — it's the clearest signal even if the
  // link happened to also carry unrelated UTM params.
  if (input.hasReferral) return { channel: "referral", raw };

  if (source === "outbound" || medium === "interest_link") {
    return { channel: "company_outreach", raw };
  }
  if (source.includes("linkedin")) return { channel: "linkedin", raw };
  if (source.includes("instagram") || source === "ig") {
    return { channel: "instagram", raw };
  }
  if (source.includes("facebook") || source === "fb") {
    return { channel: "facebook", raw };
  }
  if (source) return { channel: "other", raw };

  const referrer = input.referrer?.toLowerCase() || "";
  if (referrer) {
    const isSearchEngine = /google|bing|duckduckgo|yahoo/.test(referrer);
    return { channel: isSearchEngine ? "organic" : "other", raw };
  }

  return { channel: "direct", raw: null };
}
