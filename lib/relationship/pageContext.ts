import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database, UserType } from "@/lib/supabase/types";
import { requireConnectionAccess } from "@/lib/relationship/access";
import { loadDisplayInfoForUsers, type ConnectionDisplayInfo } from "@/lib/connections/enrich";
import { loadTalentMatchInput, loadCompanyMatchInput } from "@/lib/matching/context";
import { computeMatch, type MatchFactor } from "@/lib/matching/engine";
import {
  loadTimeline,
  ensureConnectedEvent,
  latestStage,
  type RelationshipEventRow,
} from "@/lib/relationship/persistence";
import { resolveCompanyWorkspaceId } from "@/lib/team/persistence";

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
  stage: ReturnType<typeof latestStage>;
  /** Talent CV when the other party is talent (company viewers). */
  otherCvPath: string | null;
  otherCvFileName: string | null;
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
  const companyWorkspaceId =
    userType === "company"
      ? await resolveCompanyWorkspaceId(supabase, user.id)
      : user.id;

  const [info, otherUserResult, timelineInitial] = await Promise.all([
    loadDisplayInfoForUsers(supabase, [otherUserId]),
    supabase
      .from("users")
      .select("user_type")
      .eq("id", otherUserId)
      .maybeSingle(),
    loadTimeline(supabase, connectionId),
  ]);

  const otherDisplay = info.get(otherUserId) ?? {
    name: "mingle user",
    subtitle: "",
    initial: "?",
    photo: null,
    gender: null,
  };

  let matchScore = 0;
  let alignedFactors: MatchFactor[] = [];
  let exploreFactors: MatchFactor[] = [];
  let otherCvPath: string | null = null;
  let otherCvFileName: string | null = null;

  const otherUserRow = otherUserResult.data;

  if (otherUserRow && otherUserRow.user_type !== userType) {
    const talentId = userType === "talent" ? user.id : otherUserId;
    const companyId = userType === "company" ? companyWorkspaceId : otherUserId;
    const [talentInput, companyInput, talentCvRow] = await Promise.all([
      loadTalentMatchInput(supabase, talentId),
      loadCompanyMatchInput(supabase, companyId),
      userType === "company" && otherUserRow.user_type === "talent"
        ? supabase
            .from("talent_profiles")
            .select("cv_path, cv_file_name")
            .eq("user_id", otherUserId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    if (talentInput && companyInput) {
      const result = computeMatch(talentInput, companyInput);
      matchScore = result.score;
      alignedFactors = result.factors.filter((f) => f.verdict === "aligned").slice(0, 3);
      exploreFactors = result.factors
        .filter((f) => f.verdict === "not-aligned" || f.verdict === "partial")
        .slice(0, 2);
    }
    otherCvPath = talentCvRow.data?.cv_path ?? null;
    otherCvFileName = talentCvRow.data?.cv_file_name ?? null;
  }

  // loadTimeline already degrades to [] if relationship_events doesn't
  // exist yet, but ensureConnectedEvent writes — guarded separately so
  // a missing table can't crash every page that loads this context,
  // the same class of bug already hit (and fixed) twice in Phase 6/7.
  let timeline = timelineInitial;
  try {
    const created = await ensureConnectedEvent(supabase, connectionId, timeline);
    if (created) timeline = await loadTimeline(supabase, connectionId);
  } catch {
    // Table not migrated yet — stage falls back to "connected" below.
  }

  return {
    userType,
    connection,
    otherUserId,
    otherDisplay,
    matchScore,
    alignedFactors,
    exploreFactors,
    timeline,
    stage: latestStage(timeline),
    otherCvPath,
    otherCvFileName,
  };
}
