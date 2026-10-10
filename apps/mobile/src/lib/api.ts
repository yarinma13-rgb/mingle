import { supabase } from "@/src/lib/supabase";
import type { ConnectionStatus, UserType } from "@/src/types/models";
import {
  computeMatch,
  type CompanyMatchInput,
  type TalentMatchInput,
} from "@/src/lib/matchEngine";

export type MatchFeedbackAction = "interested" | "not_fit";

export type SendConnectionResult =
  | { outcome: "sent" }
  | { outcome: "already-pending" }
  | { outcome: "already-connected" }
  | { outcome: "mutual"; connectionId: string };

export type DisplayInfo = {
  userId: string;
  name: string;
  subtitle: string;
  kind: UserType;
};

export type ProfileView = {
  userId: string;
  kind: UserType;
  title: string;
  subtitle: string;
  location: string | null;
  about: string | null;
  tags: string[];
  meta: string[];
};

export async function ensureProfile(
  userId: string,
  email: string,
  path: UserType,
): Promise<UserType> {
  const { data: existing } = await supabase
    .from("users")
    .select("user_type, onboarding_status, onboarding_step")
    .eq("id", userId)
    .maybeSingle();

  if (!existing) {
    await supabase.from("users").insert({
      id: userId,
      email,
      user_type: path,
    });
    return path;
  }

  const completed =
    existing.onboarding_status === "completed" ||
    (existing.onboarding_step ?? 0) >= 4;
  if (completed) return existing.user_type as UserType;

  if (existing.user_type !== path) {
    await supabase.from("users").update({ user_type: path }).eq("id", userId);
    return path;
  }
  return existing.user_type as UserType;
}

export async function completeOnboarding(userId: string) {
  await supabase
    .from("users")
    .update({ onboarding_status: "completed", onboarding_step: 4 })
    .eq("id", userId);
}

export async function fetchDashboardStats(userId: string) {
  const [connections, saved, conversations] = await Promise.all([
    supabase
      .from("connections")
      .select("id", { count: "exact", head: true })
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
      .eq("status", "accepted"),
    supabase
      .from("saved_profiles")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("connections")
      .select("id", { count: "exact", head: true })
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
      .eq("status", "accepted"),
  ]);

  return {
    connections: connections.count ?? 0,
    saved: saved.count ?? 0,
    conversations: conversations.count ?? 0,
  };
}

export async function fetchConnections(userId: string) {
  const { data, error } = await supabase
    .from("connections")
    .select("id, requester_id, recipient_id, status, created_at, updated_at")
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchEnrichedConnections(userId: string) {
  const rows = await fetchConnections(userId);
  const otherIds = rows.map((row) =>
    row.requester_id === userId ? row.recipient_id : row.requester_id,
  );
  const display = await loadDisplayInfoForUsers(otherIds);
  return rows.map((row) => {
    const otherId =
      row.requester_id === userId ? row.recipient_id : row.requester_id;
    const info = display.get(otherId);
    return {
      ...row,
      otherUserId: otherId,
      isIncoming: row.recipient_id === userId && row.status === "pending",
      isOutgoing: row.requester_id === userId && row.status === "pending",
      name: info?.name ?? "Connection",
      subtitle: info?.subtitle ?? "",
      kind: info?.kind ?? ("talent" as UserType),
    };
  });
}

export async function fetchConnectionById(connectionId: string) {
  const { data, error } = await supabase
    .from("connections")
    .select("id, requester_id, recipient_id, status")
    .eq("id", connectionId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchConversationForConnection(connectionId: string) {
  const { data, error } = await supabase
    .from("conversations")
    .select("id, connection_id, created_at")
    .eq("connection_id", connectionId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function ensureConversation(connectionId: string) {
  const existing = await fetchConversationForConnection(connectionId);
  if (existing) return existing;
  const { data, error } = await supabase
    .from("conversations")
    .insert({ connection_id: connectionId })
    .select("id, connection_id, created_at")
    .single();
  if (error) throw error;
  return data;
}

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

/** Ported from lib/messaging/persistence.ts (web) — Supabase Realtime on
 *  the messages table, filtered to this conversation. Returns an
 *  unsubscribe function; call it from a useFocusEffect/useEffect cleanup. */
export function subscribeToMessages(
  conversationId: string,
  onInsert: (message: MessageRow) => void,
) {
  const channel = supabase
    .channel(`conversation-${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => onInsert(payload.new as MessageRow),
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function markConversationRead(
  conversationId: string,
  viewerId: string,
) {
  const { error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", viewerId)
    .is("read_at", null);
  if (error) throw error;
}

export async function fetchMessages(conversationId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, body, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function sendMessage(input: {
  conversationId: string;
  senderId: string;
  body: string;
}) {
  const { error } = await supabase.from("messages").insert({
    conversation_id: input.conversationId,
    sender_id: input.senderId,
    body: input.body.trim(),
  });
  if (error) throw error;
}

export async function fetchDiscoverCandidates(limit = 24) {
  const { data, error } = await supabase
    .from("talent_profiles")
    .select(
      "user_id, first_name, last_name, headline, location, years_experience, skills, current_job_title, looking_for, drives, work_style, industry",
    )
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function fetchDiscoverCompanies(limit = 24) {
  const { data, error } = await supabase
    .from("company_profiles")
    .select(
      "user_id, company_name, industry, location, mission, description, values, looking_for, work_environment, company_stage",
    )
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

/** Own match input — the signed-in talent's profile + preferences, used
 *  to score companies in Discover. Null when the profile row doesn't
 *  exist yet (e.g. mid-onboarding). */
export async function loadOwnTalentMatchInput(
  userId: string,
): Promise<TalentMatchInput | null> {
  const [{ data: profile }, { data: pref }] = await Promise.all([
    supabase
      .from("talent_profiles")
      .select("drives, work_style, industry, location, years_experience")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("talent_preferences")
      .select("career_goals, company_types")
      .eq("talent_id", userId)
      .maybeSingle(),
  ]);
  if (!profile) return null;
  return {
    profile: {
      drives: profile.drives ?? [],
      workStyle: profile.work_style ?? [],
      industry: profile.industry ?? "",
      location: profile.location ?? "",
      yearsExperience: profile.years_experience,
    },
    careerGoal: pref?.career_goals ?? "",
    companyTypes: pref?.company_types ?? [],
  };
}

/** Own match input — the signed-in company's profile + preferences, used
 *  to score candidates in Candidates. Null when the profile row doesn't
 *  exist yet. */
export async function loadOwnCompanyMatchInput(
  userId: string,
): Promise<CompanyMatchInput | null> {
  const [{ data: profile }, { data: pref }] = await Promise.all([
    supabase
      .from("company_profiles")
      .select("values, work_environment, industry, location, company_stage")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("company_preferences")
      .select("hiring_needs, culture_priorities")
      .eq("company_id", userId)
      .maybeSingle(),
  ]);
  if (!profile) return null;
  return {
    profile: {
      values: profile.values ?? [],
      workEnvironment: profile.work_environment ?? [],
      industry: profile.industry ?? "",
      location: profile.location ?? "",
      companyStage: profile.company_stage ?? "",
    },
    connectingAbout: pref?.hiring_needs ?? "",
    culturePriorities: pref?.culture_priorities ?? [],
  };
}

async function loadTalentPreferencesMap(talentIds: string[]) {
  const map = new Map<string, { careerGoal: string; companyTypes: string[] }>();
  if (talentIds.length === 0) return map;
  const { data } = await supabase
    .from("talent_preferences")
    .select("talent_id, career_goals, company_types")
    .in("talent_id", talentIds);
  for (const row of data ?? []) {
    map.set(row.talent_id, {
      careerGoal: row.career_goals ?? "",
      companyTypes: row.company_types ?? [],
    });
  }
  return map;
}

async function loadCompanyPreferencesMap(companyIds: string[]) {
  const map = new Map<
    string,
    { connectingAbout: string; culturePriorities: string[] }
  >();
  if (companyIds.length === 0) return map;
  const { data } = await supabase
    .from("company_preferences")
    .select("company_id, hiring_needs, culture_priorities")
    .in("company_id", companyIds);
  for (const row of data ?? []) {
    map.set(row.company_id, {
      connectingAbout: row.hiring_needs ?? "",
      culturePriorities: row.culture_priorities ?? [],
    });
  }
  return map;
}

/** Discover companies for a talent viewer, each with a real computed
 *  match score (see src/lib/matchEngine.ts) instead of a fake one. Falls
 *  back to a neutral 50 when the viewer's own profile isn't loaded yet. */
export async function fetchDiscoverCompaniesWithScores(
  viewerId: string,
  limit = 24,
) {
  const [companies, ownInput] = await Promise.all([
    fetchDiscoverCompanies(limit),
    loadOwnTalentMatchInput(viewerId),
  ]);
  if (!ownInput || companies.length === 0) {
    return companies.map((row) => ({ ...row, score: 50 }));
  }
  const prefMap = await loadCompanyPreferencesMap(
    companies.map((row) => row.user_id),
  );
  return companies.map((row) => {
    const pref = prefMap.get(row.user_id);
    const companyInput: CompanyMatchInput = {
      profile: {
        values: row.values ?? [],
        workEnvironment: row.work_environment ?? [],
        industry: row.industry ?? "",
        location: row.location ?? "",
        companyStage: row.company_stage ?? "",
      },
      connectingAbout: pref?.connectingAbout ?? "",
      culturePriorities: pref?.culturePriorities ?? [],
    };
    const { score } = computeMatch(ownInput, companyInput);
    return { ...row, score };
  });
}

/** Discover candidates for a company viewer, each with a real computed
 *  match score instead of a fake one. Falls back to a neutral 50 when the
 *  viewer's own profile isn't loaded yet. */
export async function fetchDiscoverCandidatesWithScores(
  viewerId: string,
  limit = 24,
) {
  const [candidates, ownInput] = await Promise.all([
    fetchDiscoverCandidates(limit),
    loadOwnCompanyMatchInput(viewerId),
  ]);
  if (!ownInput || candidates.length === 0) {
    return candidates.map((row) => ({ ...row, score: 50 }));
  }
  const prefMap = await loadTalentPreferencesMap(
    candidates.map((row) => row.user_id),
  );
  return candidates.map((row) => {
    const pref = prefMap.get(row.user_id);
    const talentInput: TalentMatchInput = {
      profile: {
        drives: row.drives ?? [],
        workStyle: row.work_style ?? [],
        industry: row.industry ?? "",
        location: row.location ?? "",
        yearsExperience: row.years_experience,
      },
      careerGoal: pref?.careerGoal ?? "",
      companyTypes: pref?.companyTypes ?? [],
    };
    const { score } = computeMatch(talentInput, ownInput);
    return { ...row, score };
  });
}

export async function fetchRoles(companyId: string) {
  const { data, error } = await supabase
    .from("roles")
    .select("id, title, status, work_model, created_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchRelationshipStage(connectionId: string) {
  const { data, error } = await supabase
    .from("relationship_events")
    .select("stage, created_at")
    .eq("connection_id", connectionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data?.stage as string | undefined) ?? "connected";
}

// --- Relationship timeline (Explore / Opportunity / Decision tabs) ---
// Ported from lib/relationship/persistence.ts (web) — same stages, same
// "furthest stage reached, not just most recent" rule for ensureStageAtLeast.

export type RelationshipStage =
  | "connected"
  | "exploring"
  | "in_conversation"
  | "interview_booked"
  | "opportunity"
  | "decision"
  | "relationship";

export type RelationshipEvent = {
  id: string;
  connection_id: string;
  stage: RelationshipStage;
  actor_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

const STAGE_RANK: Record<RelationshipStage, number> = {
  connected: 0,
  exploring: 1,
  in_conversation: 2,
  interview_booked: 3,
  opportunity: 4,
  decision: 5,
  relationship: 6,
};

export function currentStage(timeline: RelationshipEvent[]): RelationshipStage {
  return timeline.reduce<RelationshipStage>(
    (furthest, event) =>
      STAGE_RANK[event.stage] > STAGE_RANK[furthest] ? event.stage : furthest,
    "connected",
  );
}

export async function loadRelationshipTimeline(
  connectionId: string,
): Promise<RelationshipEvent[]> {
  const { data, error } = await supabase
    .from("relationship_events")
    .select("id, connection_id, stage, actor_id, metadata, created_at")
    .eq("connection_id", connectionId)
    .order("created_at", { ascending: true });
  if (error) return [];
  return (data ?? []) as RelationshipEvent[];
}

async function recordRelationshipEvent(
  connectionId: string,
  stage: RelationshipStage,
  actorId?: string,
  metadata?: Record<string, unknown>,
) {
  const { error } = await supabase.from("relationship_events").insert({
    connection_id: connectionId,
    stage,
    actor_id: actorId ?? null,
    metadata: metadata ?? {},
  });
  if (error) throw error;
}

/** Records a stage only if it isn't already the furthest stage reached —
 *  re-visiting a tab never creates duplicate or out-of-order entries. */
export async function ensureStageAtLeast(
  connectionId: string,
  stage: RelationshipStage,
  timeline: RelationshipEvent[],
  actorId?: string,
  metadata?: Record<string, unknown>,
): Promise<boolean> {
  if (STAGE_RANK[stage] <= STAGE_RANK[currentStage(timeline)]) return false;
  await recordRelationshipEvent(connectionId, stage, actorId, metadata);
  return true;
}

export async function createOpportunity(
  connectionId: string,
  timeline: RelationshipEvent[],
  actorId: string,
  details: { role: string; context: string },
): Promise<boolean> {
  return ensureStageAtLeast(connectionId, "opportunity", timeline, actorId, details);
}

export type DecisionChoice =
  | "move_forward"
  | "keep_relationship"
  | "not_right_fit"
  | "stay_connected";

const POSITIVE_DECISIONS: DecisionChoice[] = ["move_forward", "keep_relationship"];

/** Always logs a "decision" event; a positive choice also logs a
 *  "relationship" event right after, matching the web timeline. */
export async function recordDecision(
  connectionId: string,
  actorId: string,
  choice: DecisionChoice,
): Promise<void> {
  await recordRelationshipEvent(connectionId, "decision", actorId, { choice });
  if (POSITIVE_DECISIONS.includes(choice)) {
    await recordRelationshipEvent(connectionId, "relationship", actorId, { choice });
  }
}

export async function loadMatchFeedbackMap(
  actorId: string,
): Promise<Record<string, MatchFeedbackAction>> {
  const { data, error } = await supabase
    .from("match_feedback")
    .select("target_user_id, action")
    .eq("actor_id", actorId);
  if (error || !data) return {};
  const map: Record<string, MatchFeedbackAction> = {};
  for (const row of data) {
    if (row.action === "interested" || row.action === "not_fit") {
      map[row.target_user_id] = row.action;
    }
  }
  return map;
}

export async function recordMatchFeedback(
  actorId: string,
  targetUserId: string,
  action: MatchFeedbackAction,
) {
  const { error } = await supabase.from("match_feedback").upsert(
    {
      actor_id: actorId,
      target_user_id: targetUserId,
      action,
      reason: null,
      free_text: null,
    },
    { onConflict: "actor_id,target_user_id" },
  );
  if (error) {
    if (/match_feedback|schema cache/i.test(error.message)) return;
    throw error;
  }
}

export async function loadSavedUserIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("saved_profiles")
    .select("saved_user_id")
    .eq("user_id", userId);
  if (error) return [];
  return (data ?? []).map((row) => row.saved_user_id);
}

export async function saveProfile(userId: string, savedUserId: string) {
  const { error } = await supabase
    .from("saved_profiles")
    .insert({ user_id: userId, saved_user_id: savedUserId });
  if (error) {
    if (error.code === "23505") return;
    throw error;
  }
}

export async function unsaveProfile(userId: string, savedUserId: string) {
  const { error } = await supabase
    .from("saved_profiles")
    .delete()
    .eq("user_id", userId)
    .eq("saved_user_id", savedUserId);
  if (error) throw error;
}

export async function expressInterest(actorId: string, targetUserId: string) {
  await saveProfile(actorId, targetUserId);
  await recordMatchFeedback(actorId, targetUserId, "interested");
  return sendOrAcceptConnection(actorId, targetUserId);
}

export async function markNotFit(actorId: string, targetUserId: string) {
  await recordMatchFeedback(actorId, targetUserId, "not_fit");
}

export async function sendOrAcceptConnection(
  fromUserId: string,
  toUserId: string,
): Promise<SendConnectionResult> {
  const { data: existingRow, error: lookupError } = await supabase
    .from("connections")
    .select("*")
    .or(
      `and(requester_id.eq.${fromUserId},recipient_id.eq.${toUserId}),and(requester_id.eq.${toUserId},recipient_id.eq.${fromUserId})`,
    )
    .maybeSingle();
  if (lookupError) throw lookupError;

  if (existingRow) {
    if (existingRow.status === "accepted") {
      return { outcome: "already-connected" };
    }
    if (existingRow.status === "pending") {
      if (existingRow.requester_id === fromUserId) {
        return { outcome: "already-pending" };
      }
      const { data: updated, error: updateError } = await supabase
        .from("connections")
        .update({ status: "accepted" })
        .eq("id", existingRow.id)
        .select("id")
        .single();
      if (updateError) throw updateError;
      return { outcome: "mutual", connectionId: updated.id };
    }
    const { error: resendError } = await supabase
      .from("connections")
      .update({
        status: "pending",
        requester_id: fromUserId,
        recipient_id: toUserId,
      })
      .eq("id", existingRow.id);
    if (resendError) throw resendError;
    return { outcome: "sent" };
  }

  const { error: insertError } = await supabase
    .from("connections")
    .insert({ requester_id: fromUserId, recipient_id: toUserId });
  if (insertError) throw insertError;
  return { outcome: "sent" };
}

export async function acceptConnection(connectionId: string) {
  const { data, error } = await supabase
    .from("connections")
    .update({ status: "accepted" })
    .eq("id", connectionId)
    .select("id, status")
    .single();
  if (error) throw error;
  return data;
}

export async function declineConnection(connectionId: string) {
  const { error } = await supabase
    .from("connections")
    .update({ status: "declined" as ConnectionStatus })
    .eq("id", connectionId);
  if (error) throw error;
}

export async function loadDisplayInfoForUsers(userIds: string[]) {
  const map = new Map<string, DisplayInfo>();
  const unique = [...new Set(userIds.filter(Boolean))];
  if (unique.length === 0) return map;

  const { data: userRows } = await supabase
    .from("users")
    .select("id, user_type")
    .in("id", unique);

  const talentIds = (userRows ?? [])
    .filter((row) => row.user_type === "talent")
    .map((row) => row.id);
  const companyIds = (userRows ?? [])
    .filter((row) => row.user_type === "company")
    .map((row) => row.id);

  const [{ data: talentRows }, { data: companyRows }] = await Promise.all([
    talentIds.length
      ? supabase
          .from("talent_profiles")
          .select("user_id, first_name, last_name, headline, current_job_title")
          .in("user_id", talentIds)
      : Promise.resolve({ data: [] as never[] }),
    companyIds.length
      ? supabase
          .from("company_profiles")
          .select("user_id, company_name, mission, industry")
          .in("user_id", companyIds)
      : Promise.resolve({ data: [] as never[] }),
  ]);

  for (const row of talentRows ?? []) {
    const name =
      [row.first_name, row.last_name].filter(Boolean).join(" ").trim() ||
      "Talent";
    map.set(row.user_id, {
      userId: row.user_id,
      name,
      subtitle: row.headline || row.current_job_title || "",
      kind: "talent",
    });
  }

  for (const row of companyRows ?? []) {
    map.set(row.user_id, {
      userId: row.user_id,
      name: row.company_name || "Company",
      subtitle: row.mission || row.industry || "",
      kind: "company",
    });
  }

  return map;
}

export async function fetchSavedProfiles(userId: string) {
  const ids = await loadSavedUserIds(userId);
  const display = await loadDisplayInfoForUsers(ids);
  return ids
    .map((id) => display.get(id))
    .filter((row): row is DisplayInfo => Boolean(row));
}

export async function fetchProfileView(userId: string): Promise<ProfileView> {
  const { data: userRow } = await supabase
    .from("users")
    .select("id, user_type")
    .eq("id", userId)
    .maybeSingle();

  const kind = (userRow?.user_type as UserType | undefined) ?? "talent";

  if (kind === "company") {
    const { data, error } = await supabase
      .from("company_profiles")
      .select(
        "user_id, company_name, industry, location, mission, description, values, looking_for, who_thrives_here, company_stage, company_size",
      )
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return {
      userId,
      kind,
      title: data?.company_name || "Company",
      subtitle: data?.mission || data?.industry || "",
      location: data?.location ?? null,
      about: data?.description || data?.who_thrives_here || null,
      tags: [
        ...(data?.values ?? []),
        ...(data?.looking_for ?? []),
      ].slice(0, 8),
      meta: [
        data?.industry,
        data?.company_stage,
        data?.company_size,
      ].filter(Boolean) as string[],
    };
  }

  const { data, error } = await supabase
    .from("talent_profiles")
    .select(
      "user_id, first_name, last_name, headline, location, years_experience, skills, current_job_title, looking_for, drives, beyond_cv, work_style",
    )
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;

  const name =
    [data?.first_name, data?.last_name].filter(Boolean).join(" ").trim() ||
    "Talent";

  return {
    userId,
    kind,
    title: name,
    subtitle: data?.headline || data?.current_job_title || "",
    location: data?.location ?? null,
    about: data?.beyond_cv || null,
    tags: [
      ...(data?.skills ?? []),
      ...(data?.drives ?? []),
      ...(data?.looking_for ?? []),
    ].slice(0, 8),
    meta: [
      data?.current_job_title,
      data?.years_experience != null
        ? `${data.years_experience} yrs experience`
        : null,
    ].filter(Boolean) as string[],
  };
}

export type TalentProfileDraft = {
  first_name: string;
  last_name: string;
  headline: string;
  location: string;
  current_job_title: string;
  industry: string;
  beyond_cv: string;
  skillsText: string;
};

export type CompanyProfileDraft = {
  company_name: string;
  industry: string;
  location: string;
  mission: string;
  description: string;
  company_stage: string;
  company_size: string;
  valuesText: string;
};

function splitTags(value: string) {
  return value
    .split(/[,;\n]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 20);
}

export async function loadTalentProfileDraft(
  userId: string,
): Promise<TalentProfileDraft> {
  const { data, error } = await supabase
    .from("talent_profiles")
    .select(
      "first_name, last_name, headline, location, current_job_title, industry, beyond_cv, skills",
    )
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return {
    first_name: data?.first_name ?? "",
    last_name: data?.last_name ?? "",
    headline: data?.headline ?? "",
    location: data?.location ?? "",
    current_job_title: data?.current_job_title ?? "",
    industry: data?.industry ?? "",
    beyond_cv: data?.beyond_cv ?? "",
    skillsText: (data?.skills ?? []).join(", "),
  };
}

export async function saveTalentProfileDraft(
  userId: string,
  draft: TalentProfileDraft,
) {
  const payload = {
    user_id: userId,
    first_name: draft.first_name.trim() || null,
    last_name: draft.last_name.trim() || null,
    headline: draft.headline.trim() || null,
    location: draft.location.trim() || null,
    current_job_title: draft.current_job_title.trim() || null,
    industry: draft.industry.trim() || null,
    beyond_cv: draft.beyond_cv.trim() || null,
    skills: splitTags(draft.skillsText),
  };
  const { error } = await supabase
    .from("talent_profiles")
    .upsert(payload, { onConflict: "user_id" });
  if (error) throw error;
}

export async function loadCompanyProfileDraft(
  userId: string,
): Promise<CompanyProfileDraft> {
  const { data, error } = await supabase
    .from("company_profiles")
    .select(
      "company_name, industry, location, mission, description, company_stage, company_size, values",
    )
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return {
    company_name: data?.company_name ?? "",
    industry: data?.industry ?? "",
    location: data?.location ?? "",
    mission: data?.mission ?? "",
    description: data?.description ?? "",
    company_stage: data?.company_stage ?? "",
    company_size: data?.company_size ?? "",
    valuesText: (data?.values ?? []).join(", "),
  };
}

export async function saveCompanyProfileDraft(
  userId: string,
  draft: CompanyProfileDraft,
) {
  const payload = {
    user_id: userId,
    company_name: draft.company_name.trim() || null,
    industry: draft.industry.trim() || null,
    location: draft.location.trim() || null,
    mission: draft.mission.trim() || null,
    description: draft.description.trim() || null,
    company_stage: draft.company_stage.trim() || null,
    company_size: draft.company_size.trim() || null,
    values: splitTags(draft.valuesText),
  };
  const { error } = await supabase
    .from("company_profiles")
    .upsert(payload, { onConflict: "user_id" });
  if (error) throw error;
}

export async function saveTalentCareerGoal(userId: string, goal: string) {
  const lookingFor = splitTags(goal);
  const { error } = await supabase.from("talent_profiles").upsert(
    {
      user_id: userId,
      looking_for: lookingFor.length ? lookingFor : [goal.trim()],
      headline: goal.trim() || null,
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

export type TeamMemberRole = "owner" | "hr" | "team_lead" | "member";

export type TeamMember = {
  id: string;
  email: string;
  role: TeamMemberRole;
  status: "invited" | "active";
};

/** Ported from lib/team/persistence.ts (web) — read + minimal invite
 *  only; role editing and the pending-invite claim flow stay web-only
 *  for now. */
export async function fetchTeamMembers(companyId: string): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from("company_members")
    .select("id, email, role, status")
    .eq("company_id", companyId)
    .order("created_at", { ascending: true });
  if (error) return [];
  return data ?? [];
}

export async function inviteTeammate(
  companyId: string,
  invitedBy: string,
  email: string,
) {
  const { error } = await supabase.from("company_members").insert({
    company_id: companyId,
    email: email.trim().toLowerCase(),
    role: "member",
    invited_by: invitedBy,
    status: "invited",
  });
  if (error) throw error;
}

export type InterviewItem = {
  id: string;
  connectionId: string;
  scheduledAt: string;
  durationMinutes: number;
  locationType: "video" | "in_person";
  status: "scheduled" | "completed" | "cancelled";
  notes: string | null;
  otherName: string;
};

/** Ported from app/interviews/page.tsx (web, company-only there) —
 *  extended to talent viewers too since mobile links "Interviews" from
 *  both tab bars. Talent side has no company_id to filter by, so it goes
 *  through the viewer's accepted connections instead. Read-only: no
 *  scheduling UI here (that needs the web's Google Calendar flow). */
export async function fetchInterviewsForViewer(
  userId: string,
  userType: UserType,
): Promise<InterviewItem[]> {
  const columns =
    "id, connection_id, scheduled_at, duration_minutes, location_type, status, notes";
  let rows: {
    id: string;
    connection_id: string;
    scheduled_at: string;
    duration_minutes: number;
    location_type: "video" | "in_person";
    status: "scheduled" | "completed" | "cancelled";
    notes: string | null;
  }[] = [];

  if (userType === "company") {
    const { data, error } = await supabase
      .from("interviews")
      .select(columns)
      .eq("company_id", userId)
      .order("scheduled_at", { ascending: true });
    if (error) return [];
    rows = data ?? [];
  } else {
    const connections = await fetchConnections(userId);
    const connectionIds = connections
      .filter((c) => c.status === "accepted")
      .map((c) => c.id);
    if (connectionIds.length === 0) return [];
    const { data, error } = await supabase
      .from("interviews")
      .select(columns)
      .in("connection_id", connectionIds)
      .order("scheduled_at", { ascending: true });
    if (error) return [];
    rows = data ?? [];
  }

  if (rows.length === 0) return [];

  const connectionIds = [...new Set(rows.map((row) => row.connection_id))];
  const { data: connections } = await supabase
    .from("connections")
    .select("id, requester_id, recipient_id")
    .in("id", connectionIds);
  const otherIds = (connections ?? []).map((row) =>
    row.requester_id === userId ? row.recipient_id : row.requester_id,
  );
  const display = await loadDisplayInfoForUsers(otherIds);
  const fallbackName = userType === "company" ? "Candidate" : "Company";
  const nameByConnection = new Map<string, string>();
  for (const row of connections ?? []) {
    const otherId =
      row.requester_id === userId ? row.recipient_id : row.requester_id;
    nameByConnection.set(row.id, display.get(otherId)?.name ?? fallbackName);
  }

  return rows.map((row) => ({
    id: row.id,
    connectionId: row.connection_id,
    scheduledAt: row.scheduled_at,
    durationMinutes: row.duration_minutes,
    locationType: row.location_type,
    status: row.status,
    notes: row.notes,
    otherName: nameByConnection.get(row.connection_id) ?? fallbackName,
  }));
}

export async function saveCompanyName(userId: string, name: string) {
  const { error } = await supabase.from("company_profiles").upsert(
    {
      user_id: userId,
      company_name: name.trim() || null,
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

export async function createRole(input: {
  companyId: string;
  title: string;
  workModel?: string;
}) {
  const { data, error } = await supabase
    .from("roles")
    .insert({
      company_id: input.companyId,
      title: input.title.trim(),
      status: "open",
      work_model: input.workModel?.trim() || null,
    })
    .select("id, title, status, work_model, created_at")
    .single();
  if (error) throw error;
  return data;
}
