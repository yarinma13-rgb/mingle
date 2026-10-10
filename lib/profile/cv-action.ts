"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  isPdfFile,
  TALENT_CV_BUCKET,
  TALENT_CV_COPY,
  TALENT_CV_MAX_BYTES,
  talentCvObjectPath,
} from "@/lib/profile/cv";
import { ensureProductStorageBuckets } from "@/lib/storage/product-buckets";

export async function uploadTalentCvAction(
  formData: FormData,
): Promise<
  | { ok: true; path: string; fileName: string }
  | { ok: false; error: string }
> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: TALENT_CV_COPY.invalidFile };
  }
  if (!isPdfFile(file) || file.size > TALENT_CV_MAX_BYTES) {
    return { ok: false, error: TALENT_CV_COPY.invalidFile };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to upload a CV." };

  const { data: userRow } = await supabase
    .from("users")
    .select("user_type")
    .eq("id", user.id)
    .maybeSingle();
  if (userRow?.user_type !== "talent") {
    return { ok: false, error: "Only talent accounts can upload a CV." };
  }

  const ensured = await ensureProductStorageBuckets();
  if (!ensured.ok) {
    return {
      ok: false,
      error:
        ensured.error ??
        TALENT_CV_COPY.notReady,
    };
  }

  const admin = createAdminClient();
  if (!admin) {
    return { ok: false, error: TALENT_CV_COPY.notReady };
  }

  const path = talentCvObjectPath(user.id);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: uploadError } = await admin.storage
    .from(TALENT_CV_BUCKET)
    .upload(path, bytes, {
      upsert: true,
      contentType: "application/pdf",
    });
  if (uploadError) {
    return { ok: false, error: uploadError.message };
  }

  const fileName =
    file.name.replace(/^.*[\\/]/, "").slice(0, 120) || "CV.pdf";
  const { error: saveError } = await supabase.from("talent_profiles").upsert(
    {
      user_id: user.id,
      cv_path: path,
      cv_file_name: fileName,
    },
    { onConflict: "user_id" },
  );
  if (saveError) {
    await admin.storage.from(TALENT_CV_BUCKET).remove([path]);
    return { ok: false, error: saveError.message };
  }

  return { ok: true, path, fileName };
}

export async function signedTalentCvUrlAction(
  path: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const trimmed = path.trim();
  if (!trimmed || trimmed.includes("..")) {
    return { ok: false, error: TALENT_CV_COPY.openFailed };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: TALENT_CV_COPY.openFailed };

  // Any authenticated viewer who can open a talent profile may open the CV.
  const ensured = await ensureProductStorageBuckets();
  if (!ensured.ok) {
    return { ok: false, error: TALENT_CV_COPY.openFailed };
  }

  const admin = createAdminClient();
  if (!admin) {
    // Fall back to the caller's client (needs storage select policy).
    const { data, error } = await supabase.storage
      .from(TALENT_CV_BUCKET)
      .createSignedUrl(trimmed, 60 * 60);
    if (error || !data?.signedUrl) {
      return { ok: false, error: TALENT_CV_COPY.openFailed };
    }
    return { ok: true, url: data.signedUrl };
  }

  const { data, error } = await admin.storage
    .from(TALENT_CV_BUCKET)
    .createSignedUrl(trimmed, 60 * 60);
  if (error || !data?.signedUrl) {
    return { ok: false, error: TALENT_CV_COPY.openFailed };
  }
  return { ok: true, url: data.signedUrl };
}
