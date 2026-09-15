import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Purge accounts whose deletion_scheduled_for has passed.
 * Protect with CRON_SECRET (Authorization: Bearer … or ?secret=).
 * Hard-deletes auth.users → cascades public data + removes Google identities.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const urlSecret = new URL(request.url).searchParams.get("secret");
  if (!secret || (auth !== secret && urlSecret !== secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY not configured", purged: 0 },
      { status: 503 },
    );
  }

  const nowIso = new Date().toISOString();
  const { data: due, error } = await admin
    .from("users")
    .select("id")
    .not("deletion_scheduled_for", "is", null)
    .lte("deletion_scheduled_for", nowIso)
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const purged: string[] = [];
  const failed: { id: string; message: string }[] = [];

  for (const row of due ?? []) {
    const { error: deleteError } = await admin.auth.admin.deleteUser(row.id);
    if (deleteError) {
      failed.push({ id: row.id, message: deleteError.message });
      continue;
    }
    purged.push(row.id);
  }

  return NextResponse.json({
    purged: purged.length,
    failed,
    ids: purged,
  });
}
