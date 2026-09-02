import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, UserType } from "@/lib/supabase/types";
import { toTalentProfile, toCompanyProfile } from "@/lib/profile-detail/adapters";
import { loadTalentMatchInput, loadCompanyMatchInput } from "@/lib/matching/context";
import {
  computeMatch,
  type TalentMatchInput,
  type CompanyMatchInput,
} from "@/lib/matching/engine";
import type { DiscoveryCard } from "@/components/discovery/DiscoveryScreen";
import {
  DISCOVERY_PAGE_SIZE,
  sanitizeIlike,
  type DiscoveryFilters,
} from "@/lib/discovery/filters";

export type DiscoveryLoadResult = {
  cards: DiscoveryCard[];
  total: number;
  page: number;
  pageSize: number;
};

export async function loadDiscoveryPage(
  supabase: SupabaseClient<Database>,
  viewer: { id: string; userType: UserType },
  filters: DiscoveryFilters,
  styleOptions: string[],
): Promise<DiscoveryLoadResult> {
  const page = filters.page;
  const from = (page - 1) * DISCOVERY_PAGE_SIZE;
  const to = from + DISCOVERY_PAGE_SIZE - 1;
  const industry = sanitizeIlike(filters.industry);
  const location = sanitizeIlike(filters.location);
  const style = styleOptions.includes(filters.style) ? filters.style : "";

  if (viewer.userType === "company") {
    const ownInput = await loadCompanyMatchInput(supabase, viewer.id);
    let query = supabase
      .from("talent_profiles")
      .select("*", { count: "exact" })
      .neq("user_id", viewer.id)
      .not("first_name", "is", null)
      .neq("first_name", "");
    if (industry) query = query.ilike("industry", `%${industry}%`);
    if (location) query = query.ilike("location", `%${location}%`);
    if (style) query = query.contains("work_style", [style]);

    const { data, count, error } = await query
      .order("updated_at", { ascending: false })
      .range(from, to);
    if (error) {
      return { cards: [], total: 0, page, pageSize: DISCOVERY_PAGE_SIZE };
    }

    const candidateRows = data ?? [];
    const { data: prefRows } = candidateRows.length
      ? await supabase
          .from("talent_preferences")
          .select("*")
          .in(
            "talent_id",
            candidateRows.map((row) => row.user_id),
          )
      : { data: [] as never[] };
    const prefsByUser = new Map((prefRows ?? []).map((row) => [row.talent_id, row]));

    const cards: DiscoveryCard[] = candidateRows.map((row) => {
      const profile = toTalentProfile(row);
      const pref = prefsByUser.get(row.user_id);
      const talentInput: TalentMatchInput = {
        profile,
        careerGoal: pref?.career_goals ?? "",
        companyTypes: pref?.company_types ?? [],
      };
      const result = ownInput
        ? computeMatch(talentInput, ownInput)
        : { score: 0, factors: [] };
      return {
        userId: row.user_id,
        name: `${profile.firstName} ${profile.lastName}`.trim(),
        subtitle: profile.headline,
        meta: [profile.location, profile.industry].filter(Boolean).join(" · "),
        initial: `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase(),
        score: result.score,
        factors: result.factors,
      };
    });
    cards.sort((a, b) => b.score - a.score);
    return {
      cards,
      total: count ?? cards.length,
      page,
      pageSize: DISCOVERY_PAGE_SIZE,
    };
  }

  const ownInput = await loadTalentMatchInput(supabase, viewer.id);
  let query = supabase
    .from("company_profiles")
    .select("*", { count: "exact" })
    .neq("user_id", viewer.id)
    .not("company_name", "is", null)
    .neq("company_name", "");
  if (industry) query = query.ilike("industry", `%${industry}%`);
  if (location) query = query.ilike("location", `%${location}%`);
  if (style) query = query.contains("work_environment", [style]);

  const { data, count, error } = await query
    .order("updated_at", { ascending: false })
    .range(from, to);
  if (error) {
    return { cards: [], total: 0, page, pageSize: DISCOVERY_PAGE_SIZE };
  }

  const candidateRows = data ?? [];
  const { data: prefRows } = candidateRows.length
    ? await supabase
        .from("company_preferences")
        .select("*")
        .in(
          "company_id",
          candidateRows.map((row) => row.user_id),
        )
    : { data: [] as never[] };
  const prefsByUser = new Map((prefRows ?? []).map((row) => [row.company_id, row]));

  const cards: DiscoveryCard[] = candidateRows.map((row) => {
    const profile = toCompanyProfile(row);
    const pref = prefsByUser.get(row.user_id);
    const companyInput: CompanyMatchInput = {
      profile,
      connectingAbout: pref?.hiring_needs ?? "",
      culturePriorities: pref?.culture_priorities ?? [],
    };
    const result = ownInput
      ? computeMatch(ownInput, companyInput)
      : { score: 0, factors: [] };
    return {
      userId: row.user_id,
      name: profile.companyName,
      subtitle: profile.mission,
      meta: [profile.industry, profile.location].filter(Boolean).join(" · "),
      initial: profile.companyName.charAt(0).toUpperCase(),
      score: result.score,
      factors: result.factors,
    };
  });
  cards.sort((a, b) => b.score - a.score);
  return {
    cards,
    total: count ?? cards.length,
    page,
    pageSize: DISCOVERY_PAGE_SIZE,
  };
}
