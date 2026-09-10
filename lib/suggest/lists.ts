import { SKILL_FIELDS } from "@/lib/skills/by-field";
import { ROLE_TITLE_SUGGESTIONS } from "@/lib/roles/questions";

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const key = value.trim();
    if (!key) continue;
    const lower = key.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    out.push(key);
  }
  return out;
}

export const LOCATION_SUGGESTIONS = [
  "Tel Aviv",
  "Jerusalem",
  "Haifa",
  "Beersheba",
  "Herzliya",
  "Ramat Gan",
  "Givatayim",
  "Holon",
  "Petah Tikva",
  "Rishon LeZion",
  "Netanya",
  "Ashkelon",
  "Ashdod",
  "Rehovot",
  "Kfar Saba",
  "Raanana",
  "Modiin",
  "Eilat",
  "Gedera",
  "Remote",
] as const;

export const INDUSTRY_SUGGESTIONS = unique([
  ...SKILL_FIELDS,
  "High tech",
  "HRtech",
  "Fintech",
  "Healthtech",
  "Cyber",
  "SaaS",
  "Climate",
  "Education",
  "Government",
  "Nonprofit",
  "Retail",
  "Manufacturing",
  "Media",
  "Legal",
  "Consulting",
  "Technology",
]);

export const TITLE_SUGGESTIONS = unique([
  ...Object.values(ROLE_TITLE_SUGGESTIONS).flat(),
  ...SKILL_FIELDS,
]);
