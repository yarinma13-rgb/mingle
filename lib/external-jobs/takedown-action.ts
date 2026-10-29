"use server";

import { redirect } from "next/navigation";
import { confirmTakedown, createTakedownRequest, takedownSchema } from "@/lib/external-jobs/takedown";

export async function submitTakedownAction(formData: FormData) {
  const parsed = takedownSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/job-removal?status=error&jobId=${encodeURIComponent(String(formData.get("jobId") ?? ""))}`);
  }
  const result = await createTakedownRequest(parsed.data);
  if (!result.ok) redirect("/job-removal?status=error");
  redirect(`/job-removal?status=${result.verificationSent ? "check_email" : "received"}`);
}

export async function confirmTakedownAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const token = String(formData.get("token") ?? "");
  const result =
    /^[0-9a-f-]{36}$/i.test(id) && token ? await confirmTakedown(id, token) : { ok: false, removed: 0 };
  redirect(result.ok ? `/job-removal?status=removed&count=${result.removed}` : "/job-removal?status=invalid");
}
