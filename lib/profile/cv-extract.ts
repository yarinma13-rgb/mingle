import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { skillOptionsForField } from "@/lib/skills/options";
import { TALENT_CV_BUCKET } from "@/lib/profile/cv";

export type CvExtractResult = {
  firstName?: string;
  lastName?: string;
  headline?: string;
  currentRole?: string;
  location?: string;
  yearsExperience?: number | null;
  industry?: string;
  skills?: string[];
  beyondCv?: string;
  summary?: string;
};

function cleanLine(line: string): string {
  return line.replace(/\s+/g, " ").trim();
}

function guessName(lines: string[]): { firstName?: string; lastName?: string } {
  for (const raw of lines.slice(0, 8)) {
    const line = cleanLine(raw);
    if (!line || line.length > 60) continue;
    if (/@|http|www\.|\d{3,}/i.test(line)) continue;
    if (/curriculum|resume|cv\b|profile|experience|education/i.test(line)) {
      continue;
    }
    const parts = line.split(/\s+/).filter(Boolean);
    if (parts.length < 2 || parts.length > 4) continue;
    if (!parts.every((part) => /^[\p{L}'’-]+$/u.test(part))) continue;
    return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
  }
  return {};
}

function guessEmailLocation(text: string): string | undefined {
  const loc = text.match(
    /\b(Tel Aviv|Jerusalem|Haifa|Herzliya|Ramat Gan|Beer Sheva|Be'er Sheva|Netanya|Remote|Israel|New York|London|Berlin|Amsterdam)\b/i,
  );
  return loc?.[1];
}

function guessYears(text: string): number | null {
  const patterns = [
    /(\d{1,2})\+?\s*(?:years|yrs)\s+(?:of\s+)?(?:experience|exp)/i,
    /experience\s*[:\-]?\s*(\d{1,2})\+?\s*(?:years|yrs)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const value = Number(match[1]);
    if (Number.isFinite(value) && value >= 0 && value <= 40) return value;
  }
  return null;
}

function guessHeadline(lines: string[], nameLine?: string): string | undefined {
  for (const raw of lines.slice(0, 12)) {
    const line = cleanLine(raw);
    if (!line || line === nameLine) continue;
    if (/@|http|www\./i.test(line)) continue;
    if (/curriculum|resume|cv\b|experience|education|skills/i.test(line)) {
      continue;
    }
    if (line.length < 3 || line.length > 80) continue;
    if (/^[\p{L}0-9 /|&+',.()-]+$/u.test(line)) return line;
  }
  return undefined;
}

function extractSkills(text: string, industry?: string): string[] {
  const options = skillOptionsForField(industry ?? "");
  const lower = text.toLowerCase();
  const hits = options.filter((skill) => lower.includes(skill.toLowerCase()));
  return hits.slice(0, 12);
}

function guessSummary(text: string): string | undefined {
  const summaryMatch = text.match(
    /(?:summary|profile|about me|about)\s*[:\-]?\s*([\s\S]{40,500}?)(?:\n\s*\n|experience|education|skills)/i,
  );
  if (!summaryMatch) return undefined;
  return cleanLine(summaryMatch[1]).slice(0, 600);
}

export function parseCvText(text: string, industryHint?: string): CvExtractResult {
  const normalized = text.replace(/\r/g, "\n");
  const lines = normalized
    .split("\n")
    .map(cleanLine)
    .filter(Boolean);
  const name = guessName(lines);
  const nameLine = [name.firstName, name.lastName].filter(Boolean).join(" ");
  const headline = guessHeadline(lines, nameLine);
  const location = guessEmailLocation(normalized);
  const yearsExperience = guessYears(normalized);
  const industry = industryHint?.trim() || undefined;
  const skills = extractSkills(normalized, industry ?? headline);
  const beyondCv = guessSummary(normalized);

  return {
    ...name,
    headline,
    currentRole: headline,
    location,
    yearsExperience,
    industry,
    skills: skills.length ? skills : undefined,
    beyondCv,
    summary: beyondCv,
  };
}

export async function extractTextFromPdf(data: ArrayBuffer): Promise<string> {
  const { extractText } = await import("unpdf");
  const result = await extractText(new Uint8Array(data), { mergePages: true });
  if (typeof result === "string") return result;
  if (result && typeof result === "object" && "text" in result) {
    const text = (result as { text: string | string[] }).text;
    return Array.isArray(text) ? text.join("\n") : String(text ?? "");
  }
  return String(result ?? "");
}

export async function downloadTalentCvPdf(
  supabase: SupabaseClient<Database>,
  cvPath: string,
): Promise<ArrayBuffer> {
  const { data, error } = await supabase.storage
    .from(TALENT_CV_BUCKET)
    .download(cvPath);
  if (error || !data) {
    throw new Error(error?.message ?? "Could not download CV");
  }
  return data.arrayBuffer();
}
