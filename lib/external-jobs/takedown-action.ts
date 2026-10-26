"use server";

import { redirect } from "next/navigation";
import { createTakedownRequest, takedownSchema } from "@/lib/external-jobs/takedown";

export async function submitTakedownAction(formData: FormData) {
  const parsed = takedownSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/job-removal?status=error&jobId=${encodeURIComponent(String(formData.get("jobId") ?? ""))}`);
  }
  const result = await createTakedownRequest(parsed.data);
  if (!result.ok) redirect("/job-removal?status=error");
  redirect(`/job-removal?status=${result.verificationSent ? "check_email" : "received"}`);
}
