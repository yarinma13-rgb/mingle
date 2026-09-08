"use server";

import { createClient } from "@/lib/supabase/server";
import { claimCompanyInvite, isMissingTeamTable } from "@/lib/team/persistence";

export async function claimCompanyInviteAction(): Promise<
  { ok: true; companyName: string } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to join the team." };

  try {
    const claimed = await claimCompanyInvite(supabase);
    if (!claimed) {
      return { ok: false, error: "No open invite for this email." };
    }
    return { ok: true, companyName: claimed.companyName };
  } catch (error) {
    if (isMissingTeamTable(error as { message?: string; code?: string })) {
      return { ok: false, error: "Team invites are not live yet." };
    }
    return { ok: false, error: "Couldn't join that team. Try again in a moment." };
  }
}
