import type { ProfileState } from "@/lib/profile/persistence";
import { uniqueCanonicalLabels, canonicalize } from "@/lib/matching/synonyms";

const WORK_MODEL_KEYS = new Set(["remote", "hybrid", "office"]);

export type CandidateDna = {
  professional: { label: string; value: string }[];
  preferences: { label: string; value: string; private?: boolean }[];
  motivations: string[];
  workStyle: string[];
};

function workModelFromStyle(workStyle: string[]): string {
  const models = uniqueCanonicalLabels(
    workStyle.filter((item) => WORK_MODEL_KEYS.has(canonicalize(item))),
  );
  return models.join(", ");
}

export function buildCandidateDna(profile: ProfileState): CandidateDna {
  const professional: CandidateDna["professional"] = [];
  if (profile.currentRole.trim()) {
    professional.push({ label: "Current role", value: profile.currentRole.trim() });
  }
  if (profile.targetRole.trim()) {
    professional.push({
      label: "Target role",
      value: profile.targetRole.trim(),
    });
  }
  if (profile.yearsExperience != null) {
    professional.push({
      label: "Experience",
      value: `${profile.yearsExperience} years`,
    });
  }
  if (profile.industry.trim()) {
    professional.push({ label: "Domain", value: profile.industry.trim() });
  }
  const skills = uniqueCanonicalLabels(profile.skills);
  if (skills.length > 0) {
    professional.push({ label: "Skills", value: skills.join(", ") });
  }
  if (profile.githubLogin || profile.githubUrl) {
    const languages =
      profile.githubMeta &&
      Array.isArray((profile.githubMeta as { languages?: unknown }).languages)
        ? ((profile.githubMeta as { languages: string[] }).languages ?? [])
        : [];
    professional.push({
      label: "GitHub",
      value: languages.length
        ? `@${profile.githubLogin ?? "linked"} · ${languages.slice(0, 3).join(", ")}`
        : `@${profile.githubLogin ?? "linked"}`,
    });
  }

  const preferences: CandidateDna["preferences"] = [];
  const searchStatus = [
    profile.isEmployed === null
      ? null
      : profile.isEmployed
        ? profile.discreetSearch
          ? "Employed · Discreet search"
          : "Employed · Open search"
        : profile.discreetSearch
          ? "Not employed · Discreet search"
          : "Not employed",
    profile.startAvailability ? `Start: ${profile.startAvailability}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  if (searchStatus) {
    preferences.push({ label: "Search", value: searchStatus });
  }
  if (profile.location.trim()) {
    preferences.push({ label: "Location", value: profile.location.trim() });
  }
  const workModel = workModelFromStyle(profile.workStyle);
  if (workModel) {
    preferences.push({ label: "Work model", value: workModel });
  }
  if (profile.salaryExpectation != null) {
    preferences.push({
      label: "Salary expectation",
      value: `${profile.salaryExpectation.toLocaleString("en-IL")} ILS / month`,
      private: true,
    });
  }

  return {
    professional,
    preferences,
    motivations: uniqueCanonicalLabels(profile.drives),
    workStyle: uniqueCanonicalLabels(
      profile.workStyle.filter((item) => !WORK_MODEL_KEYS.has(canonicalize(item))),
    ),
  };
}
