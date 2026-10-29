"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { recordEngagement } from "@/lib/external-jobs/engagement";

export async function toggleExternalJobSaveAction(formData: FormData) {
  const jobId = String(formData.get("jobId") ?? "");
  const save = String(formData.get("save") ?? "") === "true";
  if (!/^[0-9a-f-]{36}$/i.test(jobId)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  if (save) {
    const { error } = await supabase
      .from("external_job_saves")
      .upsert({ user_id: user.id, job_id: jobId }, { onConflict: "user_id,job_id", ignoreDuplicates: true });
    if (!error) await recordEngagement(jobId, "save", user.id);
  } else {
    await supabase.from("external_job_saves").delete().eq("user_id", user.id).eq("job_id", jobId);
  }
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/saved");
}
