import { supabase } from "@/src/lib/supabase";
import type { ConnectionStatus, UserType } from "@/src/types/models";

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
      "user_id, first_name, last_name, headline, location, years_experience, skills, current_job_title, looking_for, drives",
    )
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function fetchDiscoverCompanies(limit = 24) {
  const { data, error } = await supabase
    .from("company_profiles")
    .select(
      "user_id, company_name, industry, location, mission, description, values, looking_for",
    )
    .limit(limit);
  if (error) throw error;
  return data ?? [];
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
