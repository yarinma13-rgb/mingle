import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export function parseAdminEmails(raw = process.env.ADMIN_EMAILS): string[] {
  return (raw ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return parseAdminEmails().includes(email.trim().toLowerCase());
}

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");
  if (!isAdminEmail(user.email)) redirect("/dashboard");
  return { supabase, user };
}
