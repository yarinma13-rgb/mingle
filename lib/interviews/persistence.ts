import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  InterviewLocationType,
  InterviewStatus,
} from "@/lib/supabase/types";

export function isMissingInterviewsTable(
  error: { message?: string; code?: string } | null,
) {
  if (!error) return false;
  const message = (error.message ?? "").toLowerCase();
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (message.includes("interviews") &&
      (message.includes("does not exist") ||
        message.includes("schema cache") ||
        message.includes("could not find")))
  );
}

export type InterviewRecord = {
  id: string;
  companyId: string;
  connectionId: string;
  scheduledAt: string;
  durationMinutes: number;
  locationType: InterviewLocationType;
  notes: string | null;
  status: InterviewStatus;
};

function toRecord(
  row: Database["public"]["Tables"]["interviews"]["Row"],
): InterviewRecord {
  return {
    id: row.id,
    companyId: row.company_id,
    connectionId: row.connection_id,
    scheduledAt: row.scheduled_at,
    durationMinutes: row.duration_minutes,
    locationType: row.location_type,
    notes: row.notes,
    status: row.status,
  };
}

export async function loadCompanyInterviews(
  supabase: SupabaseClient<Database>,
  companyId: string,
): Promise<InterviewRecord[]> {
  const { data, error } = await supabase
    .from("interviews")
    .select("*")
    .eq("company_id", companyId)
    .order("scheduled_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toRecord);
}

export async function loadUpcomingInterviewForConnection(
  supabase: SupabaseClient<Database>,
  connectionId: string,
): Promise<InterviewRecord | null> {
  const { data, error } = await supabase
    .from("interviews")
    .select("*")
    .eq("connection_id", connectionId)
    .eq("status", "scheduled")
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) {
    if (isMissingInterviewsTable(error)) return null;
    throw error;
  }
  return data ? toRecord(data) : null;
}

export async function scheduleInterview(
  supabase: SupabaseClient<Database>,
  input: {
    companyId: string;
    connectionId: string;
    scheduledBy: string;
    scheduledAt: string;
    durationMinutes: number;
    locationType: InterviewLocationType;
    notes: string;
  },
) {
  const { data, error } = await supabase
    .from("interviews")
    .insert({
      company_id: input.companyId,
      connection_id: input.connectionId,
      scheduled_by: input.scheduledBy,
      scheduled_at: input.scheduledAt,
      duration_minutes: input.durationMinutes,
      location_type: input.locationType,
      notes: input.notes.trim() || null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return toRecord(data);
}
