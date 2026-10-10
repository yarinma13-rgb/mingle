"use server";

import { createClient } from "@/lib/supabase/server";
import {
  inviteCollaborator,
  submitCollaboratorFeedback,
  isMissingMatchCollaboratorsTable,
  type CollaboratorTone,
} from "@/lib/collaborators/persistence";
import { isActiveCompanyMember } from "@/lib/team/persistence";
import { z } from "zod";

type ActionResult = { ok: true } | { ok: false; error: string };

const inviteSchema = z.object({
  connectionId: z.string().uuid(),
  companyId: z.string().uuid(),
  invitedUserId: z.string().uuid(),
});

export async function inviteCollaboratorAction(input: {
  connectionId: string;
  companyId: string;
  invitedUserId: string;
}): Promise<ActionResult> {
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the request." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in first." };

  if (!(await isActiveCompanyMember(supabase, user.id, parsed.data.companyId))) {
    return { ok: false, error: "Only the company team can invite collaborators." };
  }
  if (
    !(await isActiveCompanyMember(
      supabase,
      parsed.data.invitedUserId,
      parsed.data.companyId,
    ))
  ) {
    return { ok: false, error: "That person isn't on your team." };
  }

  try {
    await inviteCollaborator(supabase, {
      connectionId: parsed.data.connectionId,
      companyId: parsed.data.companyId,
      invitedUserId: parsed.data.invitedUserId,
      invitedBy: user.id,
    });
    return { ok: true };
  } catch (error) {
    if (
      isMissingMatchCollaboratorsTable(
        error as { message?: string; code?: string },
      )
    ) {
      return { ok: false, error: "Not available yet. Try again later." };
    }
    return { ok: false, error: "Couldn't invite that teammate. Try again." };
  }
}

const feedbackSchema = z.object({
  connectionId: z.string().uuid(),
  companyId: z.string().uuid(),
  tone: z.enum(["positive", "neutral", "concern"]),
  comment: z.string().trim().max(500),
});

export async function submitCollaboratorFeedbackAction(input: {
  connectionId: string;
  companyId: string;
  tone: CollaboratorTone;
  comment: string;
}): Promise<ActionResult> {
  const parsed = feedbackSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Check your feedback.",
    };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in first." };

  if (!(await isActiveCompanyMember(supabase, user.id, parsed.data.companyId))) {
    return { ok: false, error: "Only the company team can leave feedback." };
  }

  try {
    await submitCollaboratorFeedback(supabase, {
      connectionId: parsed.data.connectionId,
      companyId: parsed.data.companyId,
      authorId: user.id,
      tone: parsed.data.tone,
      comment: parsed.data.comment,
    });
    return { ok: true };
  } catch (error) {
    if (
      isMissingMatchCollaboratorsTable(
        error as { message?: string; code?: string },
      )
    ) {
      return { ok: false, error: "Not available yet. Try again later." };
    }
    return { ok: false, error: "Couldn't save that. Try again." };
  }
}
