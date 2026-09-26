"use server";

import { createClient } from "@/lib/supabase/server";
import { applyToRole } from "@/lib/careers/persistence";
import { z } from "zod";

type ActionResult = { ok: true } | { ok: false; error: string };

const applySchema = z.object({
  roleId: z.string().uuid(),
});

export async function applyToRoleAction(input: {
  roleId: string;
}): Promise<ActionResult> {
  const parsed = applySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the request." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in first." };

  try {
    await applyToRole(supabase, parsed.data.roleId, user.id);
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't submit that. Try again." };
  }
}
