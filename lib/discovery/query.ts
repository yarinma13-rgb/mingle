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
  EXPERIENCE_TOLERANCE_YEARS,
  isWorkModelOption,
  sanitizeIlike,
  type DiscoveryFilters,
} from "@/lib/discovery/filters";
import { distanceKmBetween } from "@/lib/geocoding/nominatim";
import { PROFILE_QUESTIONS } from "@/lib/profile/questions";
import { companyInitials, personInitials } from "@/lib/profile/avatar";

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
  const role = sanitizeIlike(filters.role);
  const workModel = isWorkModelOption(filters.workModel) ? filters.workModel : "";

  if (viewer.userType === "company") {
    let query = supabase
      .from("talent_profiles")
      .select("*", { count: "exact" })
      .neq("user_id", viewer.id)
      .not("first_name", "is", null)
      .neq("first_name", "");
    if (industry) query = query.ilike("industry", `%${industry}%`);
    if (location) query = query.ilike("location", `%${location}%`);
    if (style) query = query.contains("work_style", [style]);
    if (workModel) query = query.contains("work_style", [workModel]);
    if (role) {
      query = query.or(
        `current_job_title.ilike.%${role}%,headline.ilike.%${role}%`,
      );
    }
    if (filters.yearsMin != null) {
      query = query.gte(
        "years_experience",
        Math.max(0, filters.yearsMin - EXPERIENCE_TOLERANCE_YEARS),
      );
    }
    if (filters.yearsMax != null) {
      query = query.lte(
        "years_experience",
        filters.yearsMax + EXPERIENCE_TOLERANCE_YEARS,
      );
    }
    if (filters.values.length > 0) {
      const driveOptions =
        PROFILE_QUESTIONS.find((question) => question.key === "drives")
          ?.options ?? [];
      const values = filters.values.filter((value) =>
        driveOptions.includes(value),
      );
      if (values.length > 0) query = query.overlaps("drives", values);
    }

    const wantsDistance = filters.distanceKm != null;
    const listedQuery = wantsDistance
      ? query.order("updated_at", { ascending: false }).limit(400)
      : query.order("updated_at", { ascending: false }).range(from, to);

    const [ownInput, listed, viewerCompany] = await Promise.all([
      loadCompanyMatchInput(supabase, viewer.id),
      listedQuery,
      supabase
        .from("company_profiles")
        .select("latitude, longitude")
        .eq("user_id", viewer.id)
        .maybeSingle(),
    ]);
    const { data, count, error } = listed;
    if (error) {
      return { cards: [], total: 0, page, pageSize: DISCOVERY_PAGE_SIZE };
    }

    const origin =
      viewerCompany.data?.latitude != null &&
      viewerCompany.data?.longitude != null
        ? {
            latitude: viewerCompany.data.latitude,
            longitude: viewerCompany.data.longitude,
          }
        : null;

    let candidateRows = data ?? [];
    if (wantsDistance && origin) {
      candidateRows = candidateRows.filter((row) => {
        const distance = distanceKmBetween(origin, {
          latitude: row.latitude ?? null,
          longitude: row.longitude ?? null,
        });
        return distance == null || distance <= (filters.distanceKm as number);
      });
    }
    const pagedRows = wantsDistance
      ? candidateRows.slice(from, to + 1)
      : candidateRows;
    const total = wantsDistance ? candidateRows.length : (count ?? pagedRows.length);
    const rowsForCards = wantsDistance ? candidateRows : pagedRows;
    const distanceByUser = new Map<string, number | null>();
    const { data: prefRows } = rowsForCards.length
      ? await supabase
          .from("talent_preferences")
          .select("*")
          .in(
            "talent_id",
            rowsForCards.map((row) => row.user_id),
          )
      : { data: [] as never[] };
    const prefsByUser = new Map((prefRows ?? []).map((row) => [row.talent_id, row]));

    const cards: DiscoveryCard[] = rowsForCards.map((row) => {
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
      const km = origin
        ? distanceKmBetween(origin, {
            latitude: row.latitude ?? null,
            longitude: row.longitude ?? null,
          })
        : null;
      distanceByUser.set(row.user_id, km);
      return {
        userId: row.user_id,
        name: `${profile.firstName} ${profile.lastName}`.trim(),
        subtitle: profile.headline,
        meta: [
          profile.location,
          profile.industry,
          wantsDistance && km != null ? `${Math.round(km)} km` : null,
        ]
          .filter(Boolean)
          .join(" · "),
        initial: personInitials(profile.firstName, profile.lastName),
        photo: profile.profilePhoto,
        gender: profile.gender,
        score: result.score,
        factors: result.factors,
      };
    });
    cards.sort((a, b) => {
      if (wantsDistance && origin) {
        const da = distanceByUser.get(a.userId) ?? Number.POSITIVE_INFINITY;
        const db = distanceByUser.get(b.userId) ?? Number.POSITIVE_INFINITY;
        if (da !== db) return da - db;
      }
      return b.score - a.score;
    });
    return {
      cards: wantsDistance ? cards.slice(from, to + 1) : cards,
      total,
      page,
      pageSize: DISCOVERY_PAGE_SIZE,
    };
  }

  let query = supabase
    .from("company_profiles")
    .select("*", { count: "exact" })
    .neq("user_id", viewer.id)
    .not("company_name", "is", null)
    .neq("company_name", "");
  if (industry) query = query.ilike("industry", `%${industry}%`);
  if (location) query = query.ilike("location", `%${location}%`);
  if (style) query = query.contains("work_environment", [style]);

  const [ownInput, listed] = await Promise.all([
    loadTalentMatchInput(supabase, viewer.id),
    query.order("updated_at", { ascending: false }).range(from, to),
  ]);
  const { data, count, error } = listed;
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
      initial: companyInitials(profile.companyName),
      photo: profile.logo,
      gender: null,
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
