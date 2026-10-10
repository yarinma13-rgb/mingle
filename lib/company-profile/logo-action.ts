"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  COMPANY_LOGO_BUCKET,
  COMPANY_LOGO_MAX_BYTES,
  ensureProductStorageBuckets,
} from "@/lib/storage/product-buckets";

function isAllowedLogo(file: File): boolean {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return (
    type === "image/jpeg" ||
    type === "image/png" ||
    type === "image/webp" ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png") ||
    name.endsWith(".webp")
  );
}

export async function uploadCompanyLogoAction(
  formData: FormData,
): Promise<{ ok: true; logoUrl: string } | { ok: false; error: string }> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a JPEG, PNG, or WebP under 5 MB." };
  }
  if (!isAllowedLogo(file) || file.size > COMPANY_LOGO_MAX_BYTES) {
    return { ok: false, error: "Choose a JPEG, PNG, or WebP under 5 MB." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to upload a logo." };

  const { data: userRow } = await supabase
    .from("users")
    .select("user_type")
    .eq("id", user.id)
    .maybeSingle();
  if (userRow?.user_type !== "company") {
    return { ok: false, error: "Only company accounts can upload a logo." };
  }

  const ensured = await ensureProductStorageBuckets();
  if (!ensured.ok) {
    return {
      ok: false,
      error:
        ensured.error ??
        "Logo storage isn't ready yet. Ask an admin to set SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const admin = createAdminClient();
  if (!admin) {
    return {
      ok: false,
      error: "Logo storage isn't ready yet. Ask an admin to set SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${user.id}/${Date.now()}-${safeName}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: uploadError } = await admin.storage
    .from(COMPANY_LOGO_BUCKET)
    .upload(path, bytes, {
      upsert: true,
      contentType: file.type || "image/png",
      cacheControl: "3600",
    });
  if (uploadError) {
    return { ok: false, error: uploadError.message };
  }

  const { data: publicUrl } = admin.storage
    .from(COMPANY_LOGO_BUCKET)
    .getPublicUrl(path);
  const logoUrl = publicUrl.publicUrl;

  const { error: saveError } = await supabase.from("company_profiles").upsert(
    { user_id: user.id, logo: logoUrl },
    { onConflict: "user_id" },
  );
  if (saveError) {
    return { ok: false, error: saveError.message };
  }

  return { ok: true, logoUrl };
}
