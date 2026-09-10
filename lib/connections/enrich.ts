import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { toTalentProfile, toCompanyProfile } from "@/lib/profile-detail/adapters";
import { resolveTalentPhotoUrls } from "@/lib/profile/photo";
import {
  companyInitials,
  personInitials,
  type Gender,
} from "@/lib/profile/avatar";

export type ConnectionDisplayInfo = {
  name: string;
  subtitle: string;
  initial: string;
  photo: string | null;
  gender: Gender | null;
};

export async function loadDisplayInfoForUsers(
  supabase: SupabaseClient<Database>,
  userIds: string[],
): Promise<Map<string, ConnectionDisplayInfo>> {
  const map = new Map<string, ConnectionDisplayInfo>();
  if (userIds.length === 0) return map;

  const { data: userRows } = await supabase
    .from("users")
    .select("id, user_type")
    .in("id", userIds);

  const talentIds = (userRows ?? [])
    .filter((row) => row.user_type === "talent")
    .map((row) => row.id);
  const companyIds = (userRows ?? [])
    .filter((row) => row.user_type === "company")
    .map((row) => row.id);

  const [{ data: talentRows }, { data: companyRows }] = await Promise.all([
    talentIds.length
      ? supabase.from("talent_profiles").select("*").in("user_id", talentIds)
      : Promise.resolve({ data: [] as never[] }),
    companyIds.length
      ? supabase.from("company_profiles").select("*").in("user_id", companyIds)
      : Promise.resolve({ data: [] as never[] }),
  ]);

  for (const row of talentRows ?? []) {
    const profile = toTalentProfile(row);
    const name = `${profile.firstName} ${profile.lastName}`.trim();
    map.set(row.user_id, {
      name: name || "Talent",
      subtitle: profile.headline,
      initial: personInitials(profile.firstName, profile.lastName),
      photo: profile.profilePhoto,
      gender: profile.gender,
    });
  }

  for (const row of companyRows ?? []) {
    const profile = toCompanyProfile(row);
    map.set(row.user_id, {
      name: profile.companyName || "Company",
      subtitle: profile.mission,
      initial: companyInitials(profile.companyName || "?"),
      photo: profile.logo,
      gender: null,
    });
  }

  const photoUrls = await resolveTalentPhotoUrls(supabase, [
    ...[...map.values()].map((info) => info.photo),
  ]);
  for (const info of map.values()) {
    const resolved = info.photo ? photoUrls.get(info.photo) : null;
    if (resolved) info.photo = resolved;
  }

  return map;
}
