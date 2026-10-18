"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendDemoRequestEmail } from "@/lib/email/demo-request";

export type DemoRequestInput = {
  firstName: string;
  lastName: string;
  workEmail: string;
  jobTitle: string;
  companyName: string;
  companySize: string;
  explore: string;
  message: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  referrer?: string | null;
  /** Honeypot: real users never see or fill this field. */
  website?: string;
};

export type DemoRequestResult = { ok: true } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PER_EMAIL_PER_HOUR = 3;

const clean = (value: string | null | undefined, max: number) =>
  (value ?? "").trim().slice(0, max);

export async function submitDemoRequest(
  input: DemoRequestInput,
): Promise<DemoRequestResult> {
  if (input.website?.trim()) return { ok: true };

  const firstName = clean(input.firstName, 80);
  const lastName = clean(input.lastName, 80);
  const workEmail = clean(input.workEmail, 200).toLowerCase();
  const companyName = clean(input.companyName, 160);
  const companySize = clean(input.companySize, 40);
  const explore = clean(input.explore, 120);

  if (!firstName || !lastName || !companyName || !companySize || !explore) {
    return { ok: false, error: "Please fill in all required fields." };
  }
  if (!EMAIL_RE.test(workEmail)) {
    return { ok: false, error: "Enter a valid work email." };
  }

  const payload = {
    first_name: firstName,
    last_name: lastName,
    work_email: workEmail,
    job_title: clean(input.jobTitle, 120) || null,
    company_name: companyName,
    company_size: companySize,
    explore,
    message: clean(input.message, 4000) || null,
    utm_source: clean(input.utmSource, 120) || null,
    utm_medium: clean(input.utmMedium, 120) || null,
    utm_campaign: clean(input.utmCampaign, 160) || null,
    referrer: clean(input.referrer, 300) || null,
  };

  const admin = createAdminClient();
  let stored = false;
  if (admin) {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await admin
      .from("demo_requests")
      .select("id", { count: "exact", head: true })
      .eq("work_email", workEmail)
      .gte("created_at", since);
    if ((count ?? 0) >= MAX_PER_EMAIL_PER_HOUR) return { ok: true };

    const { error } = await admin.from("demo_requests").insert(payload);
    stored = !error;
    if (error) console.error("[demo-request] insert failed:", error.message);
  }

  const emailed = await sendDemoRequestEmail({
    firstName,
    lastName,
    workEmail,
    jobTitle: payload.job_title ?? "",
    companyName,
    companySize,
    explore,
    message: payload.message ?? "",
    utmSource: payload.utm_source,
    utmMedium: payload.utm_medium,
    utmCampaign: payload.utm_campaign,
    referrer: payload.referrer,
  });
  if (!emailed.ok) console.error("[demo-request] email failed:", emailed.error);

  if (!stored && !emailed.ok) {
    return {
      ok: false,
      error: "We couldn't send your request. Please try again in a moment.",
    };
  }
  return { ok: true };
}
