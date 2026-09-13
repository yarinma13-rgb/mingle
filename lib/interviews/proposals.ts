import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, InterviewLocationType } from "@/lib/supabase/types";

export type InterviewProposalSlot = {
  id: string;
  startsAt: string;
  status: "offered" | "selected" | "rejected";
};

export type InterviewProposal = {
  id: string;
  companyId: string;
  connectionId: string;
  status: "pending" | "accepted" | "cancelled" | "expired";
  durationMinutes: number;
  locationType: InterviewLocationType;
  notes: string | null;
  slots: InterviewProposalSlot[];
  createdAt: string;
};

export function isMissingProposalsTable(
  error: { message?: string; code?: string } | null,
) {
  if (!error) return false;
  const message = (error.message ?? "").toLowerCase();
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (message.includes("interview_proposal") &&
      (message.includes("does not exist") ||
        message.includes("schema cache") ||
        message.includes("could not find")))
  );
}

export async function createInterviewProposal(
  supabase: SupabaseClient<Database>,
  input: {
    companyId: string;
    connectionId: string;
    proposedBy: string;
    durationMinutes: number;
    locationType: InterviewLocationType;
    notes: string;
    slotStartsAt: string[];
  },
): Promise<InterviewProposal> {
  const { data: proposal, error } = await supabase
    .from("interview_proposals")
    .insert({
      company_id: input.companyId,
      connection_id: input.connectionId,
      proposed_by: input.proposedBy,
      duration_minutes: input.durationMinutes,
      location_type: input.locationType,
      notes: input.notes.trim() || null,
    })
    .select("*")
    .single();
  if (error) throw error;

  const { data: slots, error: slotsError } = await supabase
    .from("interview_proposal_slots")
    .insert(
      input.slotStartsAt.map((startsAt) => ({
        proposal_id: proposal.id,
        starts_at: startsAt,
      })),
    )
    .select("*");
  if (slotsError) throw slotsError;

  return {
    id: proposal.id,
    companyId: proposal.company_id,
    connectionId: proposal.connection_id,
    status: proposal.status as InterviewProposal["status"],
    durationMinutes: proposal.duration_minutes,
    locationType: proposal.location_type,
    notes: proposal.notes,
    createdAt: proposal.created_at,
    slots: (slots ?? []).map((slot) => ({
      id: slot.id,
      startsAt: slot.starts_at,
      status: slot.status as InterviewProposalSlot["status"],
    })),
  };
}

export async function loadPendingProposalForConnection(
  supabase: SupabaseClient<Database>,
  connectionId: string,
): Promise<InterviewProposal | null> {
  const { data: proposal, error } = await supabase
    .from("interview_proposals")
    .select("*")
    .eq("connection_id", connectionId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    if (isMissingProposalsTable(error)) return null;
    throw error;
  }
  if (!proposal) return null;

  const { data: slots, error: slotsError } = await supabase
    .from("interview_proposal_slots")
    .select("*")
    .eq("proposal_id", proposal.id)
    .order("starts_at", { ascending: true });
  if (slotsError) throw slotsError;

  return {
    id: proposal.id,
    companyId: proposal.company_id,
    connectionId: proposal.connection_id,
    status: proposal.status as InterviewProposal["status"],
    durationMinutes: proposal.duration_minutes,
    locationType: proposal.location_type,
    notes: proposal.notes,
    createdAt: proposal.created_at,
    slots: (slots ?? []).map((slot) => ({
      id: slot.id,
      startsAt: slot.starts_at,
      status: slot.status as InterviewProposalSlot["status"],
    })),
  };
}

export async function cancelPendingProposals(
  supabase: SupabaseClient<Database>,
  connectionId: string,
  companyId: string,
) {
  const { error } = await supabase
    .from("interview_proposals")
    .update({ status: "cancelled" })
    .eq("connection_id", connectionId)
    .eq("company_id", companyId)
    .eq("status", "pending");
  if (error && !isMissingProposalsTable(error)) throw error;
}
