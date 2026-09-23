"use server";

import { createClient } from "@/lib/supabase/server";
import { narrateMatchReport, type MatchNarration } from "@/lib/matching/narrate-match";
import type { MatchReport } from "@/lib/matching/report";
import {
  saveInterviewFeedback,
  upsertEmploymentOutcome,
} from "@/lib/matching/outcome-learning";

export async function narrateMatchAction(
  report: MatchReport,
): Promise<MatchNarration> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return narrateMatchReport(report); // still safe — no secrets in report
  }
  return narrateMatchReport(report);
}

export async function submitInterviewFeedbackAction(input: {
  talentId: string;
  interviewId?: string | null;
  roleId?: string | null;
  technicalFit?: number | null;
  roleFit?: number | null;
  teamFit?: number | null;
  motivationFit?: number | null;
  recommendation?: string | null;
  notes?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: row } = await supabase
    .from("users")
    .select("user_type")
    .eq("id", user.id)
    .maybeSingle();
  if (row?.user_type !== "company") {
    return { ok: false, error: "Only company users can submit interview feedback." };
  }

  const result = await saveInterviewFeedback(supabase, {
    companyId: user.id,
    talentId: input.talentId,
    interviewerId: user.id,
    interviewId: input.interviewId,
    roleId: input.roleId,
    technicalFit: input.technicalFit,
    roleFit: input.roleFit,
    teamFit: input.teamFit,
    motivationFit: input.motivationFit,
    recommendation: input.recommendation,
    notes: input.notes,
  });
  if (!result.ok) return result;
  return { ok: true };
}

export async function submitEmploymentOutcomeAction(input: {
  talentId: string;
  roleId?: string | null;
  hireDate?: string | null;
  day30Status?: string | null;
  day30Feedback?: string | null;
  day90Status?: string | null;
  day90Feedback?: string | null;
  retained?: boolean | null;
  satisfactionScore?: number | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: row } = await supabase
    .from("users")
    .select("user_type")
    .eq("id", user.id)
    .maybeSingle();
  if (row?.user_type !== "company") {
    return { ok: false, error: "Only company users can record employment outcomes." };
  }

  const result = await upsertEmploymentOutcome(supabase, {
    companyId: user.id,
    talentId: input.talentId,
    roleId: input.roleId,
    hireDate: input.hireDate,
    day30Status: input.day30Status,
    day30Feedback: input.day30Feedback,
    day90Status: input.day90Status,
    day90Feedback: input.day90Feedback,
    retained: input.retained,
    satisfactionScore: input.satisfactionScore,
  });
  if (!result.ok) return result;
  return { ok: true };
}
