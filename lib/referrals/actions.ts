"use server";

import { createClient } from "@/lib/supabase/server";
import {
  getOrCreateReferralLink,
  markReferralStatus,
  isMissingRoleReferralsTable,
  type ReferralStatus,
} from "@/lib/referrals/persistence";
import { isActiveCompanyMember } from "@/lib/team/persistence";
import { z } from "zod";

type ActionResult = { ok: true } | { ok: false; error: string };
type CreateLinkResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

const createSchema = z.object({
  roleId: z.string().uuid(),
  companyId: z.string().uuid(),
});

export async function createReferralLinkAction(input: {
  roleId: string;
  companyId: string;
}): Promise<CreateLinkResult> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the request." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in first." };

  if (!(await isActiveCompanyMember(supabase, user.id, parsed.data.companyId))) {
    return { ok: false, error: "Only the company team can share this role." };
  }

  try {
    const { id } = await getOrCreateReferralLink(supabase, {
      companyId: parsed.data.companyId,
      roleId: parsed.data.roleId,
      referrerId: user.id,
    });
    return { ok: true, id };
  } catch (error) {
    if (
      isMissingRoleReferralsTable(
        error as { message?: string; code?: string },
      )
    ) {
      return { ok: false, error: "Not available yet. Try again later." };
    }
    return { ok: false, error: "Couldn't create that link. Try again." };
  }
}

const markPaidSchema = z.object({
  referralId: z.string().uuid(),
  companyId: z.string().uuid(),
  status: z.enum(["pending", "paid"]),
});

export async function markReferralStatusAction(input: {
  referralId: string;
  companyId: string;
  status: ReferralStatus;
}): Promise<ActionResult> {
  const parsed = markPaidSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the request." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in first." };

  if (!(await isActiveCompanyMember(supabase, user.id, parsed.data.companyId))) {
    return { ok: false, error: "Only the company team can update referrals." };
  }

  try {
    await markReferralStatus(supabase, parsed.data.referralId, parsed.data.status);
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't save that. Try again." };
  }
}
