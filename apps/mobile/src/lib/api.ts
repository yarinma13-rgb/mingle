import { supabase } from "@/src/lib/supabase";
import type { UserType } from "@/src/types/models";

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

export async function fetchDashboardStats(userId: string, _userType: UserType) {
  const [connections, saved] = await Promise.all([
    supabase
      .from("connections")
      .select("id", { count: "exact" })
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
      .eq("status", "accepted"),
    supabase
      .from("saved_profiles")
      .select("id", { count: "exact" })
      .eq("user_id", userId),
  ]);

  return {
    connections: connections.count ?? 0,
    saved: saved.count ?? 0,
    conversations: connections.count ?? 0,
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

export async function fetchDiscoverCandidates(limit = 12) {
  const { data, error } = await supabase
    .from("talent_profiles")
    .select(
      "user_id, first_name, last_name, headline, location, years_experience, skills, current_job_title",
    )
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function fetchDiscoverCompanies(limit = 12) {
  const { data, error } = await supabase
    .from("company_profiles")
    .select("user_id, company_name, industry, location, mission, description")
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

