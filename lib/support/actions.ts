"use server";

import { createClient } from "@/lib/supabase/server";
import { sendSupportRequestEmail } from "@/lib/email/support-request";
import { AnalyticsEvent } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";

const CATEGORIES = new Set([
  "something_broken",
  "account_access",
  "matching",
  "billing",
  "other",
]);

export type SupportReportInput = {
  category: string;
  subject: string;
  message: string;
  pageUrl?: string;
};

export type SupportReportResult =
  | { ok: true }
  | { ok: false; error: string };

export async function submitSupportReport(
  input: SupportReportInput,
): Promise<SupportReportResult> {
  const category = input.category.trim();
  const subject = input.subject.trim().slice(0, 120);
  const message = input.message.trim().slice(0, 4000);
  const pageUrl = input.pageUrl?.trim().slice(0, 500);

  if (!CATEGORIES.has(category)) {
    return { ok: false, error: "Choose a valid category." };
  }
  if (message.length < 10) {
    return { ok: false, error: "Please describe the problem in a bit more detail." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return { ok: false, error: "You need to be signed in to contact support." };
  }

  const { data: row } = await supabase
    .from("users")
    .select("user_type")
    .eq("id", user.id)
    .maybeSingle();

  const result = await sendSupportRequestEmail({
    userId: user.id,
    userEmail: user.email,
    userType: row?.user_type ?? "unknown",
    category,
    subject,
    message,
    pageUrl,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  track(
    AnalyticsEvent.supportReportSubmitted,
    { category },
    user.id,
  );
  return { ok: true };
}
