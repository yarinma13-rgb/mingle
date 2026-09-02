import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export const TALENT_CV_BUCKET = "talent-cvs";
export const TALENT_CV_MAX_BYTES = 5 * 1024 * 1024;
export const TALENT_CV_OBJECT = "cv.pdf";

export const TALENT_CV_COPY = {
  notReady:
    "File upload isn't ready yet. You can skip this for now and add a CV later.",
  invalidFile: "Please choose a PDF of 5 MB or less.",
  uploadFailed: "Couldn't upload that. Try again in a moment.",
  removeFailed: "Couldn't remove that. Try again in a moment.",
  openFailed: "Couldn't open that file. Try again in a moment.",
} as const;

export function talentCvObjectPath(userId: string): string {
  return `${userId}/${TALENT_CV_OBJECT}`;
}

export function isPdfFile(file: File): boolean {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return type === "application/pdf" || name.endsWith(".pdf");
}

function errorText(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: string }).message);
  }
  if (error instanceof Error) return error.message;
  return String(error);
}

export function isTalentCvUnavailable(error: unknown): boolean {
  const text = errorText(error).toLowerCase();
  return (
    text.includes("bucket") ||
    text.includes("not found") ||
    text.includes("cv_path") ||
    text.includes("cv_file_name") ||
    text.includes("does not exist") ||
    text.includes("schema cache") ||
    text.includes("pgrst204")
  );
}

export async function uploadTalentCv(
  supabase: SupabaseClient<Database>,
  userId: string,
  file: File,
): Promise<{ path: string; fileName: string }> {
  if (!isPdfFile(file) || file.size > TALENT_CV_MAX_BYTES) {
    throw new Error(TALENT_CV_COPY.invalidFile);
  }

  const path = talentCvObjectPath(userId);
  const { error: uploadError } = await supabase.storage
    .from(TALENT_CV_BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType: "application/pdf",
    });
  if (uploadError) throw uploadError;

  const fileName = file.name.replace(/^.*[\\/]/, "").slice(0, 120) || "CV.pdf";
  const { error: saveError } = await supabase.from("talent_profiles").upsert(
    {
      user_id: userId,
      cv_path: path,
      cv_file_name: fileName,
    },
    { onConflict: "user_id" },
  );
  if (saveError) {
    await supabase.storage.from(TALENT_CV_BUCKET).remove([path]);
    throw saveError;
  }

  return { path, fileName };
}

export async function removeTalentCv(
  supabase: SupabaseClient<Database>,
  userId: string,
  path: string | null,
): Promise<void> {
  if (path) {
    const { error: removeError } = await supabase.storage
      .from(TALENT_CV_BUCKET)
      .remove([path]);
    if (removeError && !isTalentCvUnavailable(removeError)) throw removeError;
  }

  const { error: saveError } = await supabase.from("talent_profiles").upsert(
    {
      user_id: userId,
      cv_path: null,
      cv_file_name: null,
    },
    { onConflict: "user_id" },
  );
  if (saveError) throw saveError;
}

export async function signedTalentCvUrl(
  supabase: SupabaseClient<Database>,
  path: string,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(TALENT_CV_BUCKET)
    .createSignedUrl(path, 60 * 60);
  if (error || !data?.signedUrl) throw error ?? new Error("No signed URL");
  return data.signedUrl;
}
