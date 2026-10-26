import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Views / apply clicks / saves for the admin Analytics tab. Written with the
 * service role (candidates have no write access to the table). Never throws.
 */
export async function recordEngagement(
  jobId: string,
  kind: "view" | "apply_click" | "save",
  userId: string | null,
): Promise<void> {
  const db = createAdminClient();
  if (!db) return;
  try {
    await db.from("external_job_engagement").insert({ job_id: jobId, kind, user_id: userId });
  } catch {
    // Analytics must never break the candidate flow.
  }
}
