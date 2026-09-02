import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { toTalentProfile, toCompanyProfile } from "@/lib/profile-detail/adapters";

export type ConnectionDisplayInfo = {
  name: string;
  subtitle: string;
  initial: string;
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
      initial: (profile.firstName.charAt(0) || "?").toUpperCase(),
    });
  }

  for (const row of companyRows ?? []) {
    const profile = toCompanyProfile(row);
    map.set(row.user_id, {
      name: profile.companyName || "Company",
      subtitle: profile.mission,
      initial: (profile.companyName.charAt(0) || "?").toUpperCase(),
    });
  }

  return map;
}
