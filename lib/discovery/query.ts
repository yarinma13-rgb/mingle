import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, UserType } from "@/lib/supabase/types";
import { toTalentProfile, toCompanyProfile } from "@/lib/profile-detail/adapters";
import { loadTalentMatchInput, loadCompanyMatchInput } from "@/lib/matching/context";
import {
  computeMatch,
  type TalentMatchInput,
  type CompanyMatchInput,
} from "@/lib/matching/engine";
import { buildMatchReport, emptyMatchReport } from "@/lib/matching/report";
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
import { resolveTalentPhotoUrls } from "@/lib/profile/photo";
import { talentDisplayHeadline, talentDisplayMeta } from "@/lib/profile-detail/display";
import { talentSearchStatusLabel } from "@/lib/profile/search-status";
import {
  companyHiringSignature,
  domainsCompatible,
  isDiscoverDomainExempt,
  talentDomainSignature,
} from "@/lib/discovery/domain-affinity";

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
  scope: {
    excludeUserIds?: string[];
    onlyUserIds?: string[];
    rankAll?: boolean;
    roleTitle?: string | null;
    roleDepartment?: string | null;
    roleRequiredSkills?: string[] | null;
  } = {},
): Promise<DiscoveryLoadResult> {
  const page = filters.page;
  const from = (page - 1) * DISCOVERY_PAGE_SIZE;
  const to = from + DISCOVERY_PAGE_SIZE - 1;
  const industry = sanitizeIlike(filters.industry);
  const location = sanitizeIlike(filters.location);
  const style = styleOptions.includes(filters.style) ? filters.style : "";
  const role = sanitizeIlike(filters.role);
  const workModel = isWorkModelOption(filters.workModel) ? filters.workModel : "";

  const onlyUserIds = scope.onlyUserIds;
  const excludeUserIds = scope.excludeUserIds ?? [];
  if (onlyUserIds && onlyUserIds.length === 0) {
    return { cards: [], total: 0, page, pageSize: DISCOVERY_PAGE_SIZE };
  }

  if (viewer.userType === "company") {
    let query = supabase
      .from("talent_profiles")
      .select("*", { count: "exact" })
      .neq("user_id", viewer.id)
      .not("first_name", "is", null)
      .neq("first_name", "");
    if (onlyUserIds) query = query.in("user_id", onlyUserIds);
    else if (excludeUserIds.length > 0) {
      query = query.not("user_id", "in", `(${excludeUserIds.join(",")})`);
    }
    if (!onlyUserIds) {
    if (industry) query = query.ilike("industry", `%${industry}%`);
    if (location) query = query.ilike("location", `%${location}%`);
    if (style) query = query.contains("work_style", [style]);
    if (workModel) query = query.contains("work_style", [workModel]);
    if (role) {
      query = query.or(
        `current_job_title.ilike.%${role}%,headline.ilike.%${role}%,target_role.ilike.%${role}%`,
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
    }

    const rankAll = Boolean(scope.rankAll);
    const wantsDistance = Boolean(filters.distanceKm != null && !onlyUserIds);
    const listedQuery =
      wantsDistance || onlyUserIds || rankAll
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

    const talentIds = rowsForCards.map((row) => row.user_id);
    let activeRows = rowsForCards;
    if (talentIds.length > 0) {
      const { data: deletionRows, error: deletionError } = await supabase
        .from("users")
        .select("id, deletion_requested_at")
        .in("id", talentIds)
        .not("deletion_requested_at", "is", null);
      // Missing deletion columns (migration not applied) → show everyone.
      if (!deletionError) {
        const pendingDeletion = new Set(
          (deletionRows ?? []).map((row) => row.id),
        );
        activeRows = rowsForCards.filter(
          (row) => !pendingDeletion.has(row.user_id),
        );
      }
    }

    // Domain affinity: companies only see talent in domains they hire for
    // (or closely related). Exempt internal test company accounts.
    if (
      ownInput &&
      !isDiscoverDomainExempt({
        userId: viewer.id,
        companyName: ownInput.profile.companyName,
      })
    ) {
      const { data: openRoles } = await supabase
        .from("roles")
        .select("title, department")
        .eq("company_id", viewer.id)
        .eq("status", "open");
      const hiringSig = companyHiringSignature({
        industry: ownInput.profile.industry,
        lookingFor: ownInput.profile.lookingFor,
        roleTitles: [
          ...(openRoles ?? []).map((role) => role.title),
          scope.roleTitle,
          ownInput.roleTitle,
        ],
        roleDepartments: [
          ...(openRoles ?? []).map((role) => role.department),
          scope.roleDepartment,
          ownInput.roleDepartment,
        ],
      });
      if (hiringSig.size > 0 && !hiringSig.has(-1)) {
        activeRows = activeRows.filter((row) => {
          const profile = toTalentProfile(row);
          const talentSig = talentDomainSignature({
            industry: profile.industry,
            currentRole: profile.currentRole,
            targetRole: profile.targetRole,
            headline: profile.headline,
            skills: profile.skills,
          });
          return domainsCompatible(hiringSig, talentSig);
        });
      }
    }

    const cards: DiscoveryCard[] = activeRows.map((row) => {
      const profile = toTalentProfile(row);
      const pref = prefsByUser.get(row.user_id);
      const talentInput: TalentMatchInput = {
        profile,
        careerGoal: pref?.career_goals ?? "",
        companyTypes: pref?.company_types ?? [],
        salaryExpectation: profile.salaryExpectation,
      };
      const companyForMatch: CompanyMatchInput | null = ownInput
        ? {
            ...ownInput,
            roleTitle: scope.roleTitle ?? ownInput.roleTitle ?? null,
            roleDepartment:
              scope.roleDepartment ?? ownInput.roleDepartment ?? null,
            roleRequiredSkills:
              scope.roleRequiredSkills ?? ownInput.roleRequiredSkills ?? null,
          }
        : null;
      const result = companyForMatch
        ? computeMatch(talentInput, companyForMatch)
        : { score: 0, factors: [] };
      const report = companyForMatch
        ? buildMatchReport(result, talentInput, companyForMatch, "company")
        : emptyMatchReport("company", result.score);
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
        subtitle: talentDisplayHeadline(
          profile.headline,
          profile.location,
          profile.currentRole,
        ),
        meta: [
          talentDisplayMeta(
            profile.location,
            profile.industry,
            profile.headline,
            profile.currentRole,
          ) || null,
          talentSearchStatusLabel({
            isEmployed: profile.isEmployed,
            discreetSearch: profile.discreetSearch,
          }),
          profile.targetRole.trim()
            ? `Target: ${profile.targetRole.trim()}`
            : null,
          wantsDistance && km != null ? `${Math.round(km)} km` : null,
        ]
          .filter(Boolean)
          .join(" · "),
        initial: personInitials(profile.firstName, profile.lastName),
        photo: profile.profilePhoto,
        gender: profile.gender,
        score: result.score,
        factors: result.factors,
        report,
        skills: profile.skills,
        cvPath: profile.cvPath,
        cvFileName: profile.cvFileName,
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
    const photoUrls = await resolveTalentPhotoUrls(
      supabase,
      cards.map((card) => card.photo),
    );
    for (const card of cards) {
      const resolved = card.photo ? photoUrls.get(card.photo) : null;
      if (resolved) card.photo = resolved;
    }
    return {
      cards: rankAll
        ? cards
        : wantsDistance
          ? cards.slice(from, to + 1)
          : cards,
      total: rankAll ? cards.length : total,
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
  if (onlyUserIds) query = query.in("user_id", onlyUserIds);
  else if (excludeUserIds.length > 0) {
    query = query.not("user_id", "in", `(${excludeUserIds.join(",")})`);
  }
  if (!onlyUserIds) {
    if (industry) query = query.ilike("industry", `%${industry}%`);
    if (location) query = query.ilike("location", `%${location}%`);
    if (style) query = query.contains("work_environment", [style]);
  }

  const wantsDistance = Boolean(filters.distanceKm != null && !onlyUserIds);
  const rankAll = Boolean(scope.rankAll);
  const listedQuery =
    wantsDistance || onlyUserIds || rankAll
      ? query.order("updated_at", { ascending: false }).limit(400)
      : query.order("updated_at", { ascending: false }).range(from, to);

  const [ownInput, listed, viewerTalent] = await Promise.all([
    loadTalentMatchInput(supabase, viewer.id),
    listedQuery,
    supabase
      .from("talent_profiles")
      .select("latitude, longitude, max_commute_km")
      .eq("user_id", viewer.id)
      .maybeSingle(),
  ]);
  const { data, count, error } = listed;
  if (error) {
    return { cards: [], total: 0, page, pageSize: DISCOVERY_PAGE_SIZE };
  }

  const origin =
    viewerTalent.data?.latitude != null &&
    viewerTalent.data?.longitude != null
      ? {
          latitude: viewerTalent.data.latitude,
          longitude: viewerTalent.data.longitude,
        }
      : null;

  // Prefer an explicit Discover filter; fall back to the talent profile preference.
  const distanceLimit =
    filters.distanceKm ??
    (viewerTalent.data?.max_commute_km != null && !onlyUserIds
      ? viewerTalent.data.max_commute_km
      : null);
  const applyDistance = distanceLimit != null && origin != null;

  let candidateRows = data ?? [];
  if (applyDistance) {
    candidateRows = candidateRows.filter((row) => {
      const distance = distanceKmBetween(origin, {
        latitude: row.latitude ?? null,
        longitude: row.longitude ?? null,
      });
      return distance == null || distance <= distanceLimit;
    });
  }

  const rowsForCards = applyDistance ? candidateRows : candidateRows;
  const { data: prefRows } = rowsForCards.length
    ? await supabase
        .from("company_preferences")
        .select("*")
        .in(
          "company_id",
          rowsForCards.map((row) => row.user_id),
        )
    : { data: [] as never[] };
  const prefsByUser = new Map((prefRows ?? []).map((row) => [row.company_id, row]));
  const distanceByUser = new Map<string, number | null>();

  const companyIdsForDeletion = rowsForCards.map((row) => row.user_id);
  let companyRowsForCards = rowsForCards;
  if (companyIdsForDeletion.length > 0) {
    const { data: companyDeletionRows, error: companyDeletionError } =
      await supabase
        .from("users")
        .select("id, deletion_requested_at")
        .in("id", companyIdsForDeletion)
        .not("deletion_requested_at", "is", null);
    if (!companyDeletionError) {
      const companyPendingDeletion = new Set(
        (companyDeletionRows ?? []).map((row) => row.id),
      );
      companyRowsForCards = rowsForCards.filter(
        (row) => !companyPendingDeletion.has(row.user_id),
      );
    }
  }

  // Preload freshest open role (incl. required skills) so Role Fit can score skills.
  const { data: openRolesForMatch } = companyRowsForCards.length
    ? await supabase
        .from("roles")
        .select(
          "company_id, title, department, work_model, salary_min, salary_max, job_presentation, description, required_skills, updated_at",
        )
        .in(
          "company_id",
          companyRowsForCards.map((row) => row.user_id),
        )
        .eq("status", "open")
        .order("updated_at", { ascending: false })
    : { data: [] as never[] };
  type OpenRoleRow = {
    company_id: string;
    title: string;
    department: string | null;
    work_model: string | null;
    salary_min: number | null;
    salary_max: number | null;
    job_presentation: string | null;
    description: string | null;
    required_skills: string[] | null;
  };
  const roleByCompany = new Map<string, OpenRoleRow>();
  for (const role of openRolesForMatch ?? []) {
    if (!roleByCompany.has(role.company_id)) {
      roleByCompany.set(role.company_id, role as OpenRoleRow);
    }
  }

  // Domain affinity: talent only sees companies/roles in their search domain.
  if (ownInput) {
    const talentSig = talentDomainSignature({
      industry: ownInput.profile.industry,
      currentRole: ownInput.profile.currentRole,
      targetRole: ownInput.profile.targetRole,
      headline: ownInput.profile.headline,
      skills: ownInput.profile.skills,
    });
    if (talentSig.size > 0 && !talentSig.has(-1)) {
      companyRowsForCards = companyRowsForCards.filter((row) => {
        const profile = toCompanyProfile(row);
        const openRole = roleByCompany.get(row.user_id);
        const companySig = companyHiringSignature({
          industry: profile.industry,
          lookingFor: profile.lookingFor,
          roleTitles: [openRole?.title],
          roleDepartments: [openRole?.department],
        });
        return domainsCompatible(talentSig, companySig);
      });
    }
  }

  const cards: DiscoveryCard[] = companyRowsForCards.map((row) => {
    const profile = toCompanyProfile(row);
    const pref = prefsByUser.get(row.user_id);
    const openRole = roleByCompany.get(row.user_id);
    const companyInput: CompanyMatchInput = {
      profile,
      connectingAbout: pref?.hiring_needs ?? "",
      culturePriorities: pref?.culture_priorities ?? [],
      roleTitle: openRole?.title ?? null,
      roleDepartment: openRole?.department ?? null,
      roleRequiredSkills: openRole?.required_skills ?? null,
    };
    const result = ownInput
      ? computeMatch(ownInput, companyInput)
      : { score: 0, factors: [] };
    const report = ownInput
      ? buildMatchReport(result, ownInput, companyInput, "talent")
      : emptyMatchReport("talent", result.score);
    const km = origin
      ? distanceKmBetween(origin, {
          latitude: row.latitude ?? null,
          longitude: row.longitude ?? null,
        })
      : null;
    distanceByUser.set(row.user_id, km);
    const workModel = profile.workEnvironment[0] ?? null;
    const locationLabel = [profile.location, workModel]
      .filter(Boolean)
      .join(", ");
    const tags = [
      ...profile.values,
      ...profile.workEnvironment,
    ].filter(Boolean).slice(0, 3);
    const about =
      profile.whoThrivesHere.trim() ||
      profile.description.trim() ||
      profile.mission.trim() ||
      null;
    const roleTitle =
      profile.lookingFor[0] ??
      (profile.industry ? `${profile.industry} roles` : "Open roles");
    return {
      userId: row.user_id,
      name: profile.companyName,
      subtitle: roleTitle,
      meta: locationLabel,
      initial: companyInitials(profile.companyName),
      photo: profile.logo,
      gender: null,
      score: result.score,
      factors: result.factors,
      report,
      kind: "company" as const,
      roleTitle,
      locationLabel: locationLabel || null,
      salaryLabel: null as string | null,
      tags,
      about: about ? about.slice(0, 160) : null,
    };
  });
  cards.sort((a, b) => {
    if (applyDistance && origin) {
      const da = distanceByUser.get(a.userId) ?? Number.POSITIVE_INFINITY;
      const db = distanceByUser.get(b.userId) ?? Number.POSITIVE_INFINITY;
      if (da !== db) return da - db;
    }
    return b.score - a.score;
  });

  // Attach role title / about from the open role. Salary amounts stay private —
  // they only affect match % via applySalaryNudge, never Discover UI.
  for (const card of cards) {
    const role = roleByCompany.get(card.userId);
    if (!role) continue;
    card.roleTitle = role.title;
    card.subtitle = role.title;
    card.salaryLabel = null;
    if (role.work_model) {
      const base = card.locationLabel?.split(",")[0]?.trim() || card.locationLabel;
      card.locationLabel = [base, role.work_model].filter(Boolean).join(", ");
      card.meta = card.locationLabel ?? card.meta;
    }
    const roleAbout = (role.job_presentation || role.description || "").trim();
    if (roleAbout) card.about = roleAbout.slice(0, 160);
  }

  const photoUrls = await resolveTalentPhotoUrls(
    supabase,
    cards.map((card) => card.photo),
  );
  for (const card of cards) {
    const resolved = card.photo ? photoUrls.get(card.photo) : null;
    if (resolved) card.photo = resolved;
  }
  const total = applyDistance ? candidateRows.length : (count ?? cards.length);
  return {
    cards: rankAll
      ? cards
      : applyDistance
        ? cards.slice(from, to + 1)
        : cards,
    total: rankAll ? cards.length : total,
    page,
    pageSize: DISCOVERY_PAGE_SIZE,
  };
}
