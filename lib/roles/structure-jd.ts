import { extractRoleFromJd } from "@/lib/roles/extract-jd";
import type { RoleDraft } from "@/lib/roles/persistence";

export type StructuredJd = {
  companyPresentation: string;
  jobPresentation: string;
  responsibilities: string;
  requirements: string;
  title?: string;
  department?: string;
  seniority?: string;
  workModel?: string;
  requiredSkills?: string[];
};

export function composeRoleDescription(structured: StructuredJd): string {
  const blocks: string[] = [];
  if (structured.companyPresentation.trim()) {
    blocks.push(`About the company\n${structured.companyPresentation.trim()}`);
  }
  if (structured.jobPresentation.trim()) {
    blocks.push(`About the role\n${structured.jobPresentation.trim()}`);
  }
  if (structured.responsibilities.trim()) {
    blocks.push(`Responsibilities\n${structured.responsibilities.trim()}`);
  }
  if (structured.requirements.trim()) {
    blocks.push(`Requirements\n${structured.requirements.trim()}`);
  }
  return blocks.join("\n\n").slice(0, 4000);
}

export function draftFromStructuredJd(
  structured: StructuredJd,
  sourceText: string,
  sourceUrl = "",
): RoleDraft {
  const heuristic = extractRoleFromJd(sourceText, sourceUrl);
  const description = composeRoleDescription(structured) || heuristic.description;

  return {
    ...heuristic,
    title: structured.title?.trim() || heuristic.title,
    department: structured.department?.trim() || heuristic.department,
    seniority: structured.seniority?.trim() || heuristic.seniority,
    workModel: structured.workModel?.trim() || heuristic.workModel,
    requiredSkills:
      structured.requiredSkills && structured.requiredSkills.length > 0
        ? structured.requiredSkills.slice(0, 8)
        : heuristic.requiredSkills,
    description,
    companyPresentation: structured.companyPresentation.trim(),
    jobPresentation: structured.jobPresentation.trim(),
    responsibilities: structured.responsibilities.trim(),
    requirements: structured.requirements.trim(),
    sourceJd: sourceText.trim().slice(0, 20_000),
    sourceUrl: sourceUrl.trim(),
  };
}

export function emptyStructuredJd(): StructuredJd {
  return {
    companyPresentation: "",
    jobPresentation: "",
    responsibilities: "",
    requirements: "",
  };
}
