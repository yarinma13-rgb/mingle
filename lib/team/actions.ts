"use server";

import { sendTeamInviteEmail } from "@/lib/email/team-invite";
import { createClient } from "@/lib/supabase/server";
import {
  inviteTeammate,
  isMissingTeamTable,
  teamRoleLabel,
} from "@/lib/team/persistence";
import type { CompanyMemberRole } from "@/lib/supabase/types";
import { z } from "zod";

const inviteSchema = z.object({
  name: z.string().trim().min(1, "Add their name").max(120),
  email: z.string().trim().email("Use a valid email").max(200),
  role: z.enum(["owner", "hr", "team_lead", "member"]),
});

export async function inviteTeammateAction(input: {
  name: string;
  email: string;
  role: CompanyMemberRole;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to invite a teammate." };

  const { data: account } = await supabase
    .from("users")
    .select("user_type, email")
    .eq("id", user.id)
    .maybeSingle();
  if (account?.user_type !== "company") {
    return { ok: false, error: "Only the company account can invite teammates." };
  }

  const ownEmail = (account.email ?? user.email ?? "").trim().toLowerCase();
  if (ownEmail && ownEmail === parsed.data.email.trim().toLowerCase()) {
    return { ok: false, error: "That is already this account." };
  }

  const { data: company } = await supabase
    .from("company_profiles")
    .select("company_name")
    .eq("user_id", user.id)
    .maybeSingle();
  const companyName = company?.company_name?.trim() || "A mingle company";

  try {
    await inviteTeammate(supabase, user.id, user.id, {
      email: parsed.data.email,
      role: parsed.data.role,
    });
  } catch (error) {
    if (isMissingTeamTable(error as { message?: string; code?: string })) {
      return {
        ok: false,
        error: "Team invites are not live yet. Ask the founder to run the SQL migration.",
      };
    }
    const message =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: string }).message).toLowerCase()
        : "";
    if (message.includes("duplicate") || message.includes("unique")) {
      return { ok: false, error: "That email already has an invite." };
    }
    return { ok: false, error: "Couldn't save that. Try again in a moment." };
  }

  try {
    await sendTeamInviteEmail({
      to: parsed.data.email.trim(),
      inviteeName: parsed.data.name,
      companyName,
      roleLabel: teamRoleLabel(parsed.data.role),
    });
  } catch {
    // Invite row already saved.
  }

  return { ok: true };
}
