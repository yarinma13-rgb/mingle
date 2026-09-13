"use server";

import { createClient } from "@/lib/supabase/server";
import {
  downloadTalentCvPdf,
  extractTextFromPdf,
  parseCvText,
  type CvExtractResult,
} from "@/lib/profile/cv-extract";

export async function extractTalentCvAction(
  cvPath: string,
  industryHint?: string,
): Promise<{ ok: true; data: CvExtractResult } | { ok: false; error: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Sign in to parse your CV." };
    if (!cvPath.startsWith(`${user.id}/`)) {
      return { ok: false, error: "CV path does not match your account." };
    }

    const bytes = await downloadTalentCvPdf(supabase, cvPath);
    const text = await extractTextFromPdf(bytes);
    if (!text.trim()) {
      return {
        ok: false,
        error:
          "We could not read text from that PDF. You can fill the form manually.",
      };
    }
    return { ok: true, data: parseCvText(text, industryHint) };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not extract details from the CV.",
    };
  }
}
