/** Prefer a clean professional title when location was folded into headline. */
export function talentDisplayHeadline(
  headline: string,
  location: string,
  currentRole: string,
): string {
  const title = headline.trim();
  if (!title) return currentRole.trim();
  const loc = location.trim();
  const role = currentRole.trim();
  if (loc && role && title === `${loc} · ${role}`) return role;
  if (loc && title.startsWith(`${loc} · `)) {
    const rest = title.slice(loc.length + 3).trim();
    if (rest) return rest;
  }
  return title;
}

/** Location (+ industry) without repeating the job title / headline. */
export function talentDisplayMeta(
  location: string,
  industry: string,
  ...avoidDuplicates: string[]
): string {
  const avoid = new Set(
    avoidDuplicates
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
  return [location, industry]
    .map((value) => value.trim())
    .filter((value) => value && !avoid.has(value.toLowerCase()))
    .join(" · ");
}
