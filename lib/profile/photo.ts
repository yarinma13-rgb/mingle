import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export const TALENT_PHOTO_BUCKET = "talent-profile-photos";
export const TALENT_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const TALENT_PHOTO_OBJECT = "photo";

const PHOTO_MIME: Record<string, string> = {
  "image/jpeg": "image/jpeg",
  "image/jpg": "image/jpeg",
  "image/png": "image/png",
  "image/webp": "image/webp",
};

export const TALENT_PHOTO_COPY = {
  notReady:
    "Photo upload isn't ready yet. You can skip this for now and add a photo later.",
  invalidFile: "Please choose a JPEG, PNG, or WebP of 5 MB or less.",
  uploadFailed: "Couldn't upload that. Try again in a moment.",
  removeFailed: "Couldn't remove that. Try again in a moment.",
} as const;

export function talentPhotoObjectPath(userId: string): string {
  return `${userId}/${TALENT_PHOTO_OBJECT}`;
}

export function isPublicPhotoUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://");
}

export function isTalentPhotoFile(file: File): boolean {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  if (PHOTO_MIME[type]) return true;
  return (
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png") ||
    name.endsWith(".webp")
  );
}

function contentTypeFor(file: File): string {
  const type = file.type.toLowerCase();
  if (PHOTO_MIME[type]) return PHOTO_MIME[type];
  const name = file.name.toLowerCase();
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

function errorText(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: string }).message);
  }
  if (error instanceof Error) return error.message;
  return String(error);
}

export function isTalentPhotoUnavailable(error: unknown): boolean {
  const text = errorText(error).toLowerCase();
  return (
    text.includes("bucket") ||
    text.includes("not found") ||
    text.includes("profile_photo") ||
    text.includes("does not exist") ||
    text.includes("schema cache") ||
    text.includes("pgrst204")
  );
}

export async function uploadTalentPhoto(
  supabase: SupabaseClient<Database>,
  userId: string,
  file: File,
): Promise<string> {
  if (!isTalentPhotoFile(file) || file.size > TALENT_PHOTO_MAX_BYTES) {
    throw new Error(TALENT_PHOTO_COPY.invalidFile);
  }

  const path = talentPhotoObjectPath(userId);
  const { error: uploadError } = await supabase.storage
    .from(TALENT_PHOTO_BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType: contentTypeFor(file),
    });
  if (uploadError) throw uploadError;

  const { error: saveError } = await supabase.from("talent_profiles").upsert(
    { user_id: userId, profile_photo: path },
    { onConflict: "user_id" },
  );
  if (saveError) {
    await supabase.storage.from(TALENT_PHOTO_BUCKET).remove([path]);
    throw saveError;
  }

  return path;
}

export async function removeTalentPhoto(
  supabase: SupabaseClient<Database>,
  userId: string,
  path: string | null,
): Promise<void> {
  if (path && !isPublicPhotoUrl(path)) {
    const { error: removeError } = await supabase.storage
      .from(TALENT_PHOTO_BUCKET)
      .remove([path]);
    if (removeError && !isTalentPhotoUnavailable(removeError)) throw removeError;
  }

  const { error: saveError } = await supabase.from("talent_profiles").upsert(
    { user_id: userId, profile_photo: null },
    { onConflict: "user_id" },
  );
  if (saveError) throw saveError;
}

export async function signedTalentPhotoUrl(
  supabase: SupabaseClient<Database>,
  path: string,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(TALENT_PHOTO_BUCKET)
    .createSignedUrl(path, 60 * 60);
  if (error || !data?.signedUrl) throw error ?? new Error("No signed URL");
  return data.signedUrl;
}

export async function resolveTalentPhotoUrls(
  supabase: SupabaseClient<Database>,
  photos: (string | null | undefined)[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const unique = [...new Set(photos.filter((item): item is string => Boolean(item)))];
  const paths: string[] = [];
  for (const photo of unique) {
    if (isPublicPhotoUrl(photo)) map.set(photo, photo);
    else paths.push(photo);
  }
  if (paths.length === 0) return map;
  const { data } = await supabase.storage
    .from(TALENT_PHOTO_BUCKET)
    .createSignedUrls(paths, 60 * 60);
  for (const row of data ?? []) {
    if (row.path && row.signedUrl) map.set(row.path, row.signedUrl);
  }
  return map;
}

export async function resolveTalentPhotoUrl(
  supabase: SupabaseClient<Database>,
  photo: string | null,
): Promise<string | null> {
  if (!photo) return null;
  if (isPublicPhotoUrl(photo)) return photo;
  try {
    return await signedTalentPhotoUrl(supabase, photo);
  } catch {
    return null;
  }
}
