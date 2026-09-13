import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type CalendarConnection = {
  companyId: string;
  accountEmail: string | null;
  calendarId: string;
  connectedAt: string;
};

export function isMissingCalendarTable(
  error: { message?: string; code?: string } | null,
) {
  if (!error) return false;
  const message = (error.message ?? "").toLowerCase();
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (message.includes("company_calendar_connections") &&
      (message.includes("does not exist") ||
        message.includes("schema cache") ||
        message.includes("could not find")))
  );
}

export async function loadCalendarConnection(
  supabase: SupabaseClient<Database>,
  companyId: string,
): Promise<CalendarConnection | null> {
  const { data, error } = await supabase
    .from("company_calendar_connections")
    .select("company_id, account_email, calendar_id, created_at")
    .eq("company_id", companyId)
    .maybeSingle();
  if (error) {
    if (isMissingCalendarTable(error)) return null;
    throw error;
  }
  if (!data) return null;
  return {
    companyId: data.company_id,
    accountEmail: data.account_email,
    calendarId: data.calendar_id,
    connectedAt: data.created_at,
  };
}

export async function upsertCalendarConnection(
  supabase: SupabaseClient<Database>,
  input: {
    companyId: string;
    connectedBy: string;
    refreshToken: string;
    accessToken: string;
    expiresAt: string | null;
    accountEmail: string | null;
  },
) {
  const { error } = await supabase.from("company_calendar_connections").upsert(
    {
      company_id: input.companyId,
      provider: "google",
      refresh_token: input.refreshToken,
      access_token: input.accessToken,
      access_token_expires_at: input.expiresAt,
      calendar_id: "primary",
      account_email: input.accountEmail,
      connected_by: input.connectedBy,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "company_id" },
  );
  if (error) throw error;
}

export async function deleteCalendarConnection(
  supabase: SupabaseClient<Database>,
  companyId: string,
) {
  const { error } = await supabase
    .from("company_calendar_connections")
    .delete()
    .eq("company_id", companyId);
  if (error) throw error;
}

export async function loadCalendarTokens(
  supabase: SupabaseClient<Database>,
  companyId: string,
): Promise<{
  refreshToken: string;
  accessToken: string | null;
  expiresAt: string | null;
  calendarId: string;
  accountEmail: string | null;
} | null> {
  const { data, error } = await supabase
    .from("company_calendar_connections")
    .select(
      "refresh_token, access_token, access_token_expires_at, calendar_id, account_email",
    )
    .eq("company_id", companyId)
    .maybeSingle();
  if (error) {
    if (isMissingCalendarTable(error)) return null;
    throw error;
  }
  if (!data) return null;
  return {
    refreshToken: data.refresh_token,
    accessToken: data.access_token,
    expiresAt: data.access_token_expires_at,
    calendarId: data.calendar_id,
    accountEmail: data.account_email,
  };
}
