import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type { DiscoveryCard } from "@/components/discovery/DiscoveryScreen";
import { sanitizeIlike } from "@/lib/discovery/filters";

export type ReviewStatus = "pending" | "approved" | "rejected" | "flagged";

export type MatchReviewRow = Database["public"]["Tables"]["match_reviews"]["Row"];

function isMissingReviewTable(message: string | undefined): boolean {
  return /match_reviews|match_review_audit|schema cache|column/i.test(
    message ?? "",
  );
}

export async function queueRoleMatches(
  supabase: SupabaseClient<Database>,
  input: {
    roleId: string;
    companyId: string;
    jobTitle: string;
    companyName: string;
    cards: DiscoveryCard[];
  },
) {
  const rows = input.cards.slice(0, 5).map((card) => {
    const roleFit = card.report.axes.find((axis) => axis.id === "role")?.score ?? null;
    const companyFit =
      card.report.axes.find((axis) => axis.id === "company")?.score ?? null;
    const motivationFit =
      card.report.axes.find((axis) => axis.id === "motivation")?.score ?? null;
    return {
      role_id: input.roleId,
      company_id: input.companyId,
      candidate_id: card.userId,
      job_title: input.jobTitle,
      company_name: input.companyName,
      candidate_name: card.name,
      overall: card.report.overall,
      role_fit: roleFit,
      company_fit: companyFit,
      motivation_fit: motivationFit,
      confidence: card.report.confidence,
    };
  });
  if (rows.length === 0) return;
  const { error } = await supabase.from("match_reviews").upsert(rows, {
    onConflict: "role_id,candidate_id",
    ignoreDuplicates: true,
  });
  if (error && !isMissingReviewTable(error.message)) {
    console.error("queueRoleMatches", error.message);
  }
}

export async function loadMatchReviews(
  supabase: SupabaseClient<Database>,
  filters: { status?: string; company?: string; sort?: string },
): Promise<MatchReviewRow[]> {
  let query = supabase.from("match_reviews").select("*");
  if (
    filters.status === "pending" ||
    filters.status === "approved" ||
    filters.status === "rejected" ||
    filters.status === "flagged"
  ) {
    query = query.eq("status", filters.status);
  }
  const company = sanitizeIlike(filters.company ?? "");
  if (company) query = query.ilike("company_name", `%${company}%`);
  const { data, error } = await query.limit(200);
  if (error) {
    if (isMissingReviewTable(error.message)) return [];
    return [];
  }
  const rows = data ?? [];
  const sort = filters.sort ?? "score";
  return [...rows].sort((a, b) => {
    if (sort === "status") return a.status.localeCompare(b.status);
    if (sort === "confidence") {
      return (a.confidence ?? "").localeCompare(b.confidence ?? "");
    }
    return (b.overall ?? 0) - (a.overall ?? 0);
  });
}

export async function loadMatchReview(
  supabase: SupabaseClient<Database>,
  roleId: string,
  candidateId: string,
): Promise<MatchReviewRow | null> {
  const { data, error } = await supabase
    .from("match_reviews")
    .select("*")
    .eq("role_id", roleId)
    .eq("candidate_id", candidateId)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function recordReviewAction(
  supabase: SupabaseClient<Database>,
  input: {
    roleId: string;
    candidateId: string;
    actorId: string;
    actorEmail: string | null;
    action: "approved" | "rejected" | "flagged" | "note";
    note?: string | null;
    snapshot?: {
      companyId: string;
      jobTitle: string;
      companyName: string;
      candidateName: string;
      overall: number;
      roleFit: number;
      companyFit: number;
      motivationFit: number;
      confidence: string;
    };
  },
) {
  const status: ReviewStatus | null =
    input.action === "note" ? null : input.action;
  const existing = await loadMatchReview(
    supabase,
    input.roleId,
    input.candidateId,
  );
  let reviewId = existing?.id;
  if (!reviewId) {
    const snap = input.snapshot;
    const { data, error } = await supabase
      .from("match_reviews")
      .insert({
        role_id: input.roleId,
        company_id: snap?.companyId ?? input.actorId,
        candidate_id: input.candidateId,
        job_title: snap?.jobTitle ?? null,
        company_name: snap?.companyName ?? null,
        candidate_name: snap?.candidateName ?? null,
        status: status ?? "pending",
        note: input.note ?? null,
        overall: snap?.overall ?? null,
        role_fit: snap?.roleFit ?? null,
        company_fit: snap?.companyFit ?? null,
        motivation_fit: snap?.motivationFit ?? null,
        confidence: snap?.confidence ?? null,
      })
      .select("id")
      .single();
    if (error) throw error;
    reviewId = data.id;
  } else {
    const patch: Database["public"]["Tables"]["match_reviews"]["Update"] = {
      note: input.note ?? existing?.note ?? null,
    };
    if (status) patch.status = status;
    const { error } = await supabase
      .from("match_reviews")
      .update(patch)
      .eq("id", reviewId);
    if (error) throw error;
  }
  const { error: auditError } = await supabase.from("match_review_audit").insert({
    review_id: reviewId,
    actor_id: input.actorId,
    actor_email: input.actorEmail,
    action: input.action,
    note: input.note ?? null,
  });
  if (auditError && !isMissingReviewTable(auditError.message)) throw auditError;
}

export async function loadReviewAudit(
  supabase: SupabaseClient<Database>,
  reviewId: string,
) {
  const { data, error } = await supabase
    .from("match_review_audit")
    .select("*")
    .eq("review_id", reviewId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return data ?? [];
}
