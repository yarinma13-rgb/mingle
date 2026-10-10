"use server";

import { createClient } from "@/lib/supabase/server";
import {
  bumpTalentReferralShare,
  getOrCreateTalentReferralCode,
  isMissingTalentReferralsTable,
  loadTalentReferralStats,
  type TalentReferralStats,
} from "@/lib/talent-referrals/persistence";
import { z } from "zod";

type CodeResult =
  | { ok: true; code: string }
  | { ok: false; error: string };

type StatsResult =
  | { ok: true; stats: TalentReferralStats }
  | { ok: false; error: string };

type ActionResult = { ok: true } | { ok: false; error: string };

export async function ensureTalentReferralCodeAction(): Promise<CodeResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in first." };

  const { data: profile } = await supabase
    .from("users")
    .select("user_type")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.user_type !== "talent") {
    return { ok: false, error: "Talent invites are for candidates." };
  }

  try {
    const code = await getOrCreateTalentReferralCode(supabase, user.id);
    return { ok: true, code };
  } catch (error) {
    if (
      isMissingTalentReferralsTable(
        error as { message?: string; code?: string },
      )
    ) {
      return { ok: false, error: "Not available yet. Try again later." };
    }
    return { ok: false, error: "Couldn't create your invite link." };
  }
}

export async function loadTalentReferralStatsAction(): Promise<StatsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in first." };

  try {
    const stats = await loadTalentReferralStats(supabase, user.id);
    if (!stats) {
      return { ok: false, error: "Not available yet. Try again later." };
    }
    return { ok: true, stats };
  } catch {
    return { ok: false, error: "Couldn't load invite stats." };
  }
}

const shareSchema = z.object({
  code: z.string().regex(/^[a-z0-9]{6,12}$/),
  channel: z.enum(["copy", "whatsapp", "linkedin", "email", "native"]),
});

export async function bumpTalentReferralShareAction(input: {
  code: string;
  channel: "copy" | "whatsapp" | "linkedin" | "email" | "native";
}): Promise<ActionResult> {
  const parsed = shareSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the request." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in first." };

  try {
    await bumpTalentReferralShare(supabase, parsed.data.code);
    return { ok: true };
  } catch (error) {
    if (
      isMissingTalentReferralsTable(
        error as { message?: string; code?: string },
      )
    ) {
      return { ok: false, error: "Not available yet." };
    }
    return { ok: false, error: "Couldn't record that share." };
  }
}
