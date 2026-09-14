"use server";

import { createClient } from "@/lib/supabase/server";
import { GeminiError, geminiApiKey, geminiGenerateJson } from "@/lib/ai/gemini";
import { extractRoleFromJd } from "@/lib/roles/extract-jd";
import {
  draftFromStructuredJd,
  emptyStructuredJd,
  type StructuredJd,
} from "@/lib/roles/structure-jd";
import type { RoleDraft } from "@/lib/roles/persistence";
import {
  ROLE_DEPARTMENT_OPTIONS,
  ROLE_SENIORITY_OPTIONS,
  WORK_MODEL_OPTIONS,
} from "@/lib/roles/questions";

export type StructureJdResult =
  | { ok: true; structured: StructuredJd; draft: RoleDraft; usedAi: boolean }
  | { ok: false; error: string };

type GeminiJdPayload = {
  companyPresentation?: string;
  jobPresentation?: string;
  responsibilities?: string;
  requirements?: string;
  title?: string;
  department?: string;
  seniority?: string;
  workModel?: string;
  requiredSkills?: string[];
};

function asText(value: unknown, max = 2000): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function pickOption(value: unknown, options: readonly string[]): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  const hit = options.find(
    (option) => option.toLowerCase() === trimmed.toLowerCase(),
  );
  return hit ?? "";
}

function normalizeStructured(raw: GeminiJdPayload): StructuredJd {
  const skills = Array.isArray(raw.requiredSkills)
    ? raw.requiredSkills
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 8)
    : [];

  return {
    companyPresentation: asText(raw.companyPresentation),
    jobPresentation: asText(raw.jobPresentation),
    responsibilities: asText(raw.responsibilities, 3000),
    requirements: asText(raw.requirements, 3000),
    title: asText(raw.title, 120) || undefined,
    department: pickOption(raw.department, ROLE_DEPARTMENT_OPTIONS) || undefined,
    seniority: pickOption(raw.seniority, ROLE_SENIORITY_OPTIONS) || undefined,
    workModel: pickOption(raw.workModel, WORK_MODEL_OPTIONS) || undefined,
    requiredSkills: skills.length ? skills : undefined,
  };
}

function heuristicStructured(text: string): StructuredJd {
  const draft = extractRoleFromJd(text);
  const body = text.trim().slice(0, 2500);
  return {
    ...emptyStructuredJd(),
    companyPresentation: "",
    jobPresentation: draft.description || body.slice(0, 600),
    responsibilities: "",
    requirements: draft.requiredSkills.length
      ? draft.requiredSkills.map((skill) => `• ${skill}`).join("\n")
      : "",
    title: draft.title || undefined,
    department: draft.department || undefined,
    seniority: draft.seniority || undefined,
    workModel: draft.workModel || undefined,
    requiredSkills: draft.requiredSkills,
  };
}

export async function structureJobFromFreeTextAction(
  rawText: string,
): Promise<StructureJdResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Sign in as a company to structure a job." };
  }

  const text = rawText.trim().slice(0, 20_000);
  if (text.length < 40) {
    return {
      ok: false,
      error: "Paste a fuller job description (at least a few sentences).",
    };
  }

  if (!geminiApiKey()) {
    const structured = heuristicStructured(text);
    return {
      ok: true,
      structured,
      draft: draftFromStructuredJd(structured, text),
      usedAi: false,
    };
  }

  try {
    const raw = await geminiGenerateJson<GeminiJdPayload>({
      system: [
        "You rewrite messy free-text job descriptions into structured hiring copy.",
        "Return JSON only with keys:",
        "companyPresentation, jobPresentation, responsibilities, requirements,",
        "title, department, seniority, workModel, requiredSkills.",
        "companyPresentation: short company blurb.",
        "jobPresentation: what the role is and why it matters.",
        "responsibilities: bullet-friendly plain text of ownership.",
        "requirements: bullet-friendly plain text of must-haves.",
        `department must be one of: ${ROLE_DEPARTMENT_OPTIONS.join(", ")} (or empty).`,
        `seniority must be one of: ${ROLE_SENIORITY_OPTIONS.join(", ")} (or empty).`,
        `workModel must be one of: ${WORK_MODEL_OPTIONS.join(", ")} (or empty).`,
        "requiredSkills: array of up to 8 short skill strings.",
        "Keep language matching the input (Hebrew or English). Do not invent fake company facts.",
      ].join(" "),
      user: text,
    });

    const structured = normalizeStructured(raw);
    if (
      !structured.companyPresentation &&
      !structured.jobPresentation &&
      !structured.responsibilities &&
      !structured.requirements
    ) {
      const fallback = heuristicStructured(text);
      return {
        ok: true,
        structured: fallback,
        draft: draftFromStructuredJd(fallback, text),
        usedAi: true,
      };
    }

    return {
      ok: true,
      structured,
      draft: draftFromStructuredJd(structured, text),
      usedAi: true,
    };
  } catch (caught) {
    if (caught instanceof GeminiError) {
      return { ok: false, error: caught.message };
    }
    const fallback = heuristicStructured(text);
    return {
      ok: true,
      structured: fallback,
      draft: draftFromStructuredJd(fallback, text),
      usedAi: false,
    };
  }
}
