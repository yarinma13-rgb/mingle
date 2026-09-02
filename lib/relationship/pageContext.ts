import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database, UserType } from "@/lib/supabase/types";
import { requireConnectionAccess } from "@/lib/relationship/access";
import { loadDisplayInfoForUsers, type ConnectionDisplayInfo } from "@/lib/connections/enrich";
import { loadTalentMatchInput, loadCompanyMatchInput } from "@/lib/matching/context";
import { computeMatch, type MatchFactor } from "@/lib/matching/engine";
import {
  loadTimeline,
  ensureConnectedEvent,
  currentStage,
  type RelationshipEventRow,
} from "@/lib/relationship/persistence";
type ConnectionRow = Database["public"]["Tables"]["connections"]["Row"];

export type RelationshipPageContext = {
  userType: UserType;
  connection: ConnectionRow;
  otherUserId: string;
  otherDisplay: ConnectionDisplayInfo;
  matchScore: number;
  alignedFactors: MatchFactor[];
  exploreFactors: MatchFactor[];
  timeline: RelationshipEventRow[];
  stage: ReturnType<typeof currentStage>;
  accountLabel: string;
  initials: string;
};

export async function loadRelationshipPageContext(
  supabase: SupabaseClient<Database>,
  connectionId: string,
  user: User,
  userType: UserType,
): Promise<RelationshipPageContext> {
  const { connection, otherUserId } = await requireConnectionAccess(
    supabase,
    connectionId,
    user.id,
  );

  const info = await loadDisplayInfoForUsers(supabase, [otherUserId]);
  const otherDisplay = info.get(otherUserId) ?? {
    name: "mingle user",
    subtitle: "",
    initial: "?",
  };

  let matchScore = 0;
  let alignedFactors: MatchFactor[] = [];
  let exploreFactors: MatchFactor[] = [];

  const { data: otherUserRow } = await supabase
    .from("users")
    .select("user_type")
    .eq("id", otherUserId)
    .maybeSingle();

  if (otherUserRow && otherUserRow.user_type !== userType) {
    const talentId = userType === "talent" ? user.id : otherUserId;
    const companyId = userType === "company" ? user.id : otherUserId;
    const [talentInput, companyInput] = await Promise.all([
      loadTalentMatchInput(supabase, talentId),
      loadCompanyMatchInput(supabase, companyId),
    ]);
    if (talentInput && companyInput) {
      const result = computeMatch(talentInput, companyInput);
      matchScore = result.score;
      alignedFactors = result.factors.filter((f) => f.verdict === "aligned").slice(0, 3);
      exploreFactors = result.factors
        .filter((f) => f.verdict === "not-aligned" || f.verdict === "partial")
        .slice(0, 2);
    }
  }

  // loadTimeline already degrades to [] if relationship_events doesn't
  // exist yet, but ensureConnectedEvent writes — guarded separately so
  // a missing table can't crash every page that loads this context,
  // the same class of bug already hit (and fixed) twice in Phase 6/7.
  let timeline = await loadTimeline(supabase, connectionId);
  try {
    const created = await ensureConnectedEvent(supabase, connectionId, timeline);
    if (created) timeline = await loadTimeline(supabase, connectionId);
  } catch {
    // Table not migrated yet — stage falls back to "connected" below.
  }

  const accountLabel = user.email?.split("@")[0] ?? "You";
  const initials = accountLabel.slice(0, 2).toUpperCase();

  return {
    userType,
    connection,
    otherUserId,
    otherDisplay,
    matchScore,
    alignedFactors,
    exploreFactors,
    timeline,
    stage: currentStage(timeline),
    accountLabel,
    initials,
  };
}
