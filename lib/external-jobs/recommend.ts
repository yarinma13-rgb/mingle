import { overlapCanonical } from "@/lib/matching/synonyms";
import { normalizeForKey } from "@/lib/external-jobs/text";

export type TalentJobSignals = {
  skills: string[];
  targetRole: string | null;
  currentTitle: string | null;
  workStyle: string[];
  location: string | null;
};

export type JobForScoring = {
  title: string;
  tags: string[];
  location: string | null;
  workModel: string | null;
};

export type JobRecommendation = {
  score: number;
  reasons: string[];
};

const STOP = new Set(["senior", "junior", "lead", "the", "and", "for", "with", "sr", "jr", "mid"]);

function titleWords(value: string | null): Set<string> {
  return new Set(
    normalizeForKey(value)
      .split(" ")
      .filter((w) => w.length > 1 && !STOP.has(w)),
  );
}

/**
 * Lightweight, explainable fit score between a talent profile and a job
 * (company-managed or external). Uses the same skill canonicalization as the
 * main match engine. Read-only: nothing here is sent anywhere.
 */
export function recommendJob(talent: TalentJobSignals, job: JobForScoring): JobRecommendation {
  const reasons: string[] = [];
  let score = 0;

  if (job.tags.length && talent.skills.length) {
    const matched = overlapCanonical(talent.skills, job.tags);
    if (matched.length) {
      score += Math.min(50, Math.round((matched.length / Math.min(job.tags.length, 5)) * 50));
      reasons.push(`Skills: ${matched.slice(0, 3).join(", ")}${matched.length > 3 ? ` +${matched.length - 3}` : ""}`);
    }
  }

  const jobWords = titleWords(job.title);
  let bestRole = 0;
  for (const candidate of [talent.targetRole, talent.currentTitle]) {
    const words = titleWords(candidate);
    if (!words.size || !jobWords.size) continue;
    const shared = [...words].filter((w) => jobWords.has(w)).length;
    bestRole = Math.max(bestRole, shared / Math.max(words.size, 1));
  }
  if (bestRole > 0) {
    score += Math.round(bestRole * 30);
    reasons.push("Close to the role you're aiming for");
  }

  if (job.workModel && talent.workStyle.includes(job.workModel)) {
    score += 10;
    reasons.push(`${job.workModel} like you prefer`);
  }

  const talentCity = normalizeForKey(talent.location).split(" ")[0];
  if (talentCity && normalizeForKey(job.location).includes(talentCity)) {
    score += 10;
    reasons.push("Near you");
  }

  return { score: Math.min(100, score), reasons };
}

export const RECOMMENDED_THRESHOLD = 40;
