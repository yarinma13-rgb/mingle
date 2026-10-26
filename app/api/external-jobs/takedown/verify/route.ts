import { NextResponse } from "next/server";
import { verifyTakedown } from "@/lib/external-jobs/takedown";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** One-time link from the takedown verification email. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id") ?? "";
  const token = url.searchParams.get("token") ?? "";
  const result =
    /^[0-9a-f-]{36}$/i.test(id) && token ? await verifyTakedown(id, token) : { ok: false, removed: 0 };
  const target = new URL("/job-removal", req.url);
  target.searchParams.set("status", result.ok ? "removed" : "invalid");
  if (result.ok) target.searchParams.set("count", String(result.removed));
  return NextResponse.redirect(target, 302);
}
