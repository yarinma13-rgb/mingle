import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { destinationAfterAuth } from "@/lib/auth/destination";
import type { UserType } from "@/lib/supabase/types";

/**
 * If a session already exists, send the user past marketing/start screens
 * to their real destination from public.users.user_type.
 */
export async function redirectIfAuthenticated() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data } = await supabase
    .from("users")
    .select("user_type")
    .eq("id", user.id)
    .maybeSingle();

  const path: UserType =
    data?.user_type === "company" || data?.user_type === "talent"
      ? data.user_type
      : "talent";

  redirect(
    await destinationAfterAuth(supabase, user.id, path, user.email ?? null),
  );
}
