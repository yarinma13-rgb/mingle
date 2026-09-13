"use server";

import { createClient } from "@/lib/supabase/server";
import {
  importRoleFromJobBoardUrl,
  JobBoardImportError,
} from "@/lib/roles/job-board-import";
import type { RoleDraft } from "@/lib/roles/persistence";

export type ImportJdFromUrlResult =
  | { ok: true; draft: RoleDraft }
  | { ok: false; error: string };

export async function importJdFromUrlAction(
  rawUrl: string,
): Promise<ImportJdFromUrlResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { ok: false, error: "Sign in as a company to import a job URL." };
    }

    const draft = await importRoleFromJobBoardUrl(rawUrl);
    return { ok: true, draft };
  } catch (caught) {
    if (caught instanceof JobBoardImportError) {
      return { ok: false, error: caught.message };
    }
    return {
      ok: false,
      error:
        "We could not import that job URL. Paste the job description as text instead, then try again.",
    };
  }
}
