/**
 * Post-rejection talent discovery: the candidate_visibility opt-in, its
 * audit trail, and the company-interested / candidate-interested / mutual
 * state machine (talent_exchange_interest), keyed off the existing
 * matches anchor (lib/matching/match-anchor.ts) so it's already scoped
 * per candidate x role x company with team-workspace-aware RLS.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { getOrCreateMatchId } from "@/lib/matching/match-anchor";
import {
  countAcceptedConnections,
  declineConnection,
  noteReferralMatch,
} from "@/lib/connections/persistence";
import {
  findCrossCompanyOpportunities,
  type CrossCompanyOpportunity,
} from "@/lib/talent-exchange/recommendations";
import { AnalyticsEvent } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";

export type CandidateVisibilityStatus =
  | "private"
  | "discoverable"
  | "open_to_opportunities";

export type VisibilitySource = "post_rejection_flow" | "privacy_settings";

export async function getCandidateVisibility(
  supabase: SupabaseClient<Database>,
  candidateId: string,
): Promise<CandidateVisibilityStatus> {
  const { data } = await supabase
    .from("candidate_visibility")
    .select("status")
    .eq("candidate_id", candidateId)
    .maybeSingle();
  return (data?.status as CandidateVisibilityStatus | undefined) ?? "private";
}

/**
 * The only path allowed to change a candidate's visibility — always writes
 * an audit row alongside the status change, per the product's "no silent
 * visibility change" requirement.
 */
export async function setCandidateVisibility(
  supabase: SupabaseClient<Database>,
  candidateId: string,
  newStatus: CandidateVisibilityStatus,
  source: VisibilitySource,
): Promise<void> {
  const previousStatus = await getCandidateVisibility(supabase, candidateId);

  const { error: upsertError } = await supabase
    .from("candidate_visibility")
    .upsert(
      { candidate_id: candidateId, status: newStatus },
      { onConflict: "candidate_id" },
    );
  if (upsertError) throw upsertError;

  const { error: auditError } = await supabase.from("visibility_audit_log").insert({
    candidate_id: candidateId,
    previous_status: previousStatus,
    new_status: newStatus,
    source,
    consent_version: "v1",
  });
  if (auditError) throw auditError;

  track(
    AnalyticsEvent.candidateVisibilityChanged,
    { previous_status: previousStatus, new_status: newStatus, source },
    candidateId,
  );
}

export async function loadTalentExchangeAuditTrail(
  supabase: SupabaseClient<Database>,
  candidateId: string,
) {
  const { data } = await supabase
    .from("visibility_audit_log")
    .select("*")
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export type TalentExchangeInterestRow =
  Database["public"]["Tables"]["talent_exchange_interest"]["Row"];

export type ExpressCompanyInterestResult =
  | { outcome: "recorded" }
  | { outcome: "already-interested" };

/**
 * A company marks "Interested" on an anonymous candidate card. Does NOT
 * reveal identity by itself — only resolveTalentExchangeMutual() (called
 * from respondToCompanyInterest below) does that, and only once both
 * sides have opted in.
 */
export async function expressCompanyInterest(
  supabase: SupabaseClient<Database>,
  matchId: string,
): Promise<ExpressCompanyInterestResult> {
  const { data: existing } = await supabase
    .from("talent_exchange_interest")
    .select("company_interested")
    .eq("match_id", matchId)
    .maybeSingle();

  if (existing?.company_interested) {
    return { outcome: "already-interested" };
  }

  const { error } = await supabase.from("talent_exchange_interest").upsert(
    { match_id: matchId, company_interested: true },
    { onConflict: "match_id" },
  );
  if (error) throw error;

  track(AnalyticsEvent.talentExchangeCompanyInterested, { match_id: matchId });
  return { outcome: "recorded" };
}

export type RespondToCompanyInterestResult =
  | { outcome: "declined" }
  | { outcome: "waiting-on-company" }
  | { outcome: "mutual"; isFirstMingle: boolean };

/**
 * The candidate responds to a company's interest. Mirrors
 * sendOrAcceptConnection's "whichever side completes it resolves mutual
 * regardless of order" property, but via two independent flags on one
 * row (company and candidate are structurally distinct roles here, not
 * symmetric peers) rather than connections' row-reassignment trick.
 */
export async function respondToCompanyInterest(
  supabase: SupabaseClient<Database>,
  matchId: string,
  candidateId: string,
  companyId: string,
  interested: boolean,
): Promise<RespondToCompanyInterestResult> {
  if (!interested) {
    const { error } = await supabase
      .from("talent_exchange_interest")
      .update({ candidate_interested: false, status: "candidate_declined" })
      .eq("match_id", matchId);
    if (error) throw error;
    track(
      AnalyticsEvent.talentExchangeCandidateResponded,
      { match_id: matchId, interested: false },
      candidateId,
    );
    return { outcome: "declined" };
  }

  const { data: row, error: updateError } = await supabase
    .from("talent_exchange_interest")
    .update({ candidate_interested: true })
    .eq("match_id", matchId)
    .select("company_interested")
    .single();
  if (updateError) throw updateError;

  if (!row.company_interested) {
    // Candidate opted in first — wait for the company side. (Not reachable
    // from the current UI, which only shows this screen after a company
    // has already expressed interest, but kept correct either way.)
    return { outcome: "waiting-on-company" };
  }

  const isFirstMingle = await resolveTalentExchangeMutual(
    supabase,
    matchId,
    candidateId,
    companyId,
  );
  track(
    AnalyticsEvent.talentExchangeCandidateResponded,
    { match_id: matchId, interested: true },
    candidateId,
  );
  return { outcome: "mutual", isFirstMingle };
}

/**
 * Both sides are interested: flip status to mutual and create the real,
 * already-accepted connections row directly — mirroring exactly what
 * sendOrAcceptConnection's own "mutual" branch does (insert/accept in one
 * step, then the same isFirstMingle/mingleCreated/referral side effects)
 * rather than round-tripping through its pending-then-accept dance, which
 * assumes two peer-to-peer actors. Everything downstream (messaging,
 * Board, pipeline) then runs on the existing, unmodified connections
 * system — nothing new to build there.
 */
async function resolveTalentExchangeMutual(
  supabase: SupabaseClient<Database>,
  matchId: string,
  candidateId: string,
  companyId: string,
): Promise<boolean> {
  const { error: statusError } = await supabase
    .from("talent_exchange_interest")
    .update({ status: "mutual" })
    .eq("match_id", matchId);
  if (statusError) throw statusError;

  const { data: connection, error: connectionError } = await supabase
    .from("connections")
    .insert({
      requester_id: companyId,
      recipient_id: candidateId,
      status: "accepted",
    })
    .select("id")
    .single();
  if (connectionError) throw connectionError;

  const acceptedCount = await countAcceptedConnections(supabase, candidateId);
  const isFirstMingle = acceptedCount <= 1;
  track(
    AnalyticsEvent.mingleCreated,
    {
      connection_id: connection.id,
      is_first_match: isFirstMingle,
      source: "talent_exchange",
    },
    candidateId,
  );
  noteReferralMatch(supabase, candidateId);

  return isFirstMingle;
}

/**
 * Wraps the existing declineConnection() with the post-rejection
 * opportunity check — never changes decline behavior itself, purely
 * additive. Only runs the cross-company search when a COMPANY is
 * declining a TALENT (the other direction — a candidate declining a
 * company — has no visibility prompt). Returns the qualifying
 * opportunities (if any) so the caller can show the prompt immediately;
 * nothing is persisted here, since role status can change and the prompt
 * screen recomputes fresh when the candidate actually opens it.
 */
export async function declineConnectionAndCheckOpportunities(
  supabase: SupabaseClient<Database>,
  connectionId: string,
): Promise<CrossCompanyOpportunity[]> {
  const [{ data: connectionRow }, { data: authData }] = await Promise.all([
    supabase
      .from("connections")
      .select("requester_id, recipient_id")
      .eq("id", connectionId)
      .single(),
    supabase.auth.getUser(),
  ]);

  await declineConnection(supabase, connectionId);

  const declinerId = authData.user?.id;
  if (!connectionRow || !declinerId) return [];

  const candidateId =
    connectionRow.requester_id === declinerId
      ? connectionRow.recipient_id
      : connectionRow.requester_id;

  const { data: userRows } = await supabase
    .from("users")
    .select("id, user_type")
    .in("id", [declinerId, candidateId]);
  const declinerType = userRows?.find((u) => u.id === declinerId)?.user_type;
  const candidateType = userRows?.find((u) => u.id === candidateId)?.user_type;
  if (declinerType !== "company" || candidateType !== "talent") return [];

  const opportunities = await findCrossCompanyOpportunities(
    supabase,
    candidateId,
    declinerId,
  );
  if (opportunities.length > 0) {
    track(
      AnalyticsEvent.talentExchangeOpportunitiesFound,
      { count: opportunities.length },
      candidateId,
    );
  }
  return opportunities;
}

export { getOrCreateMatchId };
