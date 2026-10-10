import { createAdminClient } from "@/lib/supabase/admin";
import { TALENT_CV_BUCKET, TALENT_CV_MAX_BYTES } from "@/lib/profile/cv";

export const COMPANY_LOGO_BUCKET = "logos";
export const COMPANY_LOGO_MAX_BYTES = 5 * 1024 * 1024;

/**
 * Idempotently create product storage buckets with the service role.
 * Policies still come from SQL migrations when present; uploads that go
 * through the admin client do not need object RLS.
 */
export async function ensureProductStorageBuckets(): Promise<{
  ok: boolean;
  error?: string;
}> {
  const admin = createAdminClient();
  if (!admin) {
    return {
      ok: false,
      error: "Storage admin is not configured (SUPABASE_SERVICE_ROLE_KEY).",
    };
  }

  const specs = [
    {
      id: COMPANY_LOGO_BUCKET,
      public: true,
      fileSizeLimit: COMPANY_LOGO_MAX_BYTES,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    },
    {
      id: TALENT_CV_BUCKET,
      public: false,
      fileSizeLimit: TALENT_CV_MAX_BYTES,
      allowedMimeTypes: ["application/pdf"],
    },
  ] as const;

  for (const spec of specs) {
    const { data: existing, error: getError } = await admin.storage.getBucket(
      spec.id,
    );
    if (existing && !getError) {
      await admin.storage.updateBucket(spec.id, {
        public: spec.public,
        fileSizeLimit: spec.fileSizeLimit,
        allowedMimeTypes: [...spec.allowedMimeTypes],
      });
      continue;
    }

    const { error: createError } = await admin.storage.createBucket(spec.id, {
      public: spec.public,
      fileSizeLimit: spec.fileSizeLimit,
      allowedMimeTypes: [...spec.allowedMimeTypes],
    });
    if (
      createError &&
      !/already exists|duplicate|409/i.test(createError.message)
    ) {
      return { ok: false, error: createError.message };
    }
  }

  return { ok: true };
}
