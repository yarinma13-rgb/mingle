import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type AdminDb = SupabaseClient<Database>;

export type EngineSettings = {
  crawlingEnabled: boolean;
  autoPublishEnabled: boolean;
};

export async function loadSettings(db: AdminDb): Promise<EngineSettings> {
  const { data } = await db
    .from("external_jobs_settings")
    .select("crawling_enabled, auto_publish_enabled")
    .eq("id", true)
    .maybeSingle();
  return {
    crawlingEnabled: data?.crawling_enabled ?? true,
    autoPublishEnabled: data?.auto_publish_enabled ?? true,
  };
}

export type EventKind =
  | "crawl_started"
  | "crawl_finished"
  | "source_error"
  | "source_blocked"
  | "permission_blocked"
  | "discovered"
  | "processed"
  | "ai_error"
  | "published"
  | "updated"
  | "validation_failed"
  | "duplicate"
  | "unchanged"
  | "resumed"
  | "paused"
  | "expired"
  | "removed"
  | "rejected"
  | "manual_edit"
  | "manual_publish"
  | "publishing_paused"
  | "source_added"
  | "source_updated"
  | "settings_changed"
  | "takedown_requested"
  | "takedown_completed";

/** Audit trail for every engine and admin action. Never throws. */
export async function logEvent(
  db: AdminDb,
  event: {
    kind: EventKind;
    jobId?: string | null;
    sourceId?: string | null;
    runId?: string | null;
    message?: string | null;
    detail?: unknown;
    actor?: string;
  },
): Promise<void> {
  try {
    await db.from("external_job_events").insert({
      kind: event.kind,
      job_id: event.jobId ?? null,
      source_id: event.sourceId ?? null,
      run_id: event.runId ?? null,
      message: event.message ?? null,
      detail: event.detail ?? null,
      actor: event.actor ?? "system",
    });
  } catch {
    // Logging must never break the pipeline.
  }
}
