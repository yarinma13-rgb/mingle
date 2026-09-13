import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { loadAcceptedConnections } from "@/lib/connections/persistence";
import { loadSavedUserIds } from "@/lib/matching/saved";

export type TalentDashboardStats = {
  newConnections: number;
  activeConversations: number;
  savedCompanies: number;
};

/** Same sources as Connections / Conversations / Saved list pages. */
export async function loadTalentDashboardStats(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<TalentDashboardStats> {
  const [accepted, savedIds] = await Promise.all([
    loadAcceptedConnections(supabase, userId),
    loadSavedUserIds(supabase, userId),
  ]);

  // Conversations list shows every accepted connection (with or without messages).
  return {
    newConnections: accepted.length,
    activeConversations: accepted.length,
    savedCompanies: savedIds.length,
  };
}
