import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { TALENT_CV_BUCKET, TALENT_CV_OBJECT } from "@/lib/profile/cv";
import { ensureProductStorageBuckets } from "@/lib/storage/product-buckets";

/**
 * Prefer the profile column; if empty, recover a PDF left in storage and
 * backfill cv_path so companies always get a button when a file exists.
 */
export async function resolveTalentCvForViewer(
  talentUserId: string,
  cvPath: string | null | undefined,
  cvFileName: string | null | undefined,
): Promise<{ cvPath: string | null; cvFileName: string | null }> {
  if (cvPath?.trim()) {
    return {
      cvPath: cvPath.trim(),
      cvFileName: cvFileName?.trim() || "CV.pdf",
    };
  }

  const admin = createAdminClient();
  if (!admin) {
    return { cvPath: null, cvFileName: null };
  }

  await ensureProductStorageBuckets();
  const { data: files, error } = await admin.storage
    .from(TALENT_CV_BUCKET)
    .list(talentUserId, { limit: 20 });
  if (error || !files?.length) {
    return { cvPath: null, cvFileName: null };
  }

  const pdf =
    files.find((f) => f.name === TALENT_CV_OBJECT) ??
    files.find((f) => f.name.toLowerCase().endsWith(".pdf"));
  if (!pdf) {
    return { cvPath: null, cvFileName: null };
  }

  const path = `${talentUserId}/${pdf.name}`;
  const fileName = pdf.name === TALENT_CV_OBJECT ? "CV.pdf" : pdf.name;

  // Best-effort backfill so Discover cards pick it up next load.
  try {
    const supabase = await createClient();
    await supabase.from("talent_profiles").upsert(
      {
        user_id: talentUserId,
        cv_path: path,
        cv_file_name: fileName,
      },
      { onConflict: "user_id" },
    );
  } catch {
    // Ignore backfill failures — still return the recovered path for this view.
  }

  return { cvPath: path, cvFileName: fileName };
}
