import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  RecommendationDelivery,
  RecommendationStatus,
} from "@/lib/supabase/types";

export type SubmittedRecommendation = {
  id: string;
  rating: number;
  body: string;
  recommenderName: string;
};

export function isMissingRecommendationsTable(
  error: { message?: string; code?: string } | null,
) {
  if (!error) return false;
  const message = (error.message ?? "").toLowerCase();
  return (
    error.code === "42P01" ||
    error.code === "PGRST202" ||
    error.code === "PGRST205" ||
    ((message.includes("recommendation") ||
      message.includes("submit_recommendation") ||
      message.includes("list_submitted_recommendations")) &&
      (message.includes("does not exist") ||
        message.includes("schema cache") ||
        message.includes("could not find")))
  );
}

export async function createRecommendationRequest(
  supabase: SupabaseClient<Database>,
  candidateId: string,
  input: {
    recommenderName: string;
    recommenderContact: string;
    deliveryMethod: RecommendationDelivery;
  },
) {
  const { data, error } = await supabase
    .from("recommendations")
    .insert({
      candidate_id: candidateId,
      recommender_name: input.recommenderName,
      recommender_contact: input.recommenderContact,
      delivery_method: input.deliveryMethod,
    })
    .select("id, token")
    .single();
  if (error) throw error;
  return data;
}

export async function loadSubmittedRecommendations(
  supabase: SupabaseClient<Database>,
  candidateId: string,
): Promise<SubmittedRecommendation[]> {
  const { data, error } = await supabase.rpc("list_submitted_recommendations", {
    p_candidate_id: candidateId,
  });
  if (error) {
    if (isMissingRecommendationsTable(error)) return [];
    throw error;
  }
  return (data ?? [])
    .filter((row) => row.rating != null)
    .map((row) => ({
      id: row.id,
      rating: row.rating as number,
      body: row.body ?? "",
      recommenderName: row.recommender_name,
    }));
}

export async function previewRecommendationRequest(
  supabase: SupabaseClient<Database>,
  token: string,
): Promise<{ status: RecommendationStatus; candidateName: string } | null> {
  const { data, error } = await supabase.rpc("recommendation_request_preview", {
    p_token: token,
  });
  if (error) {
    if (isMissingRecommendationsTable(error)) return null;
    throw error;
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.status) return null;
  if (row.status !== "pending" && row.status !== "submitted") return null;
  return {
    status: row.status,
    candidateName: row.candidate_name?.trim() || "a mingle candidate",
  };
}
