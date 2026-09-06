import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserType } from "@/lib/supabase/types";

export async function requireShellUser(opts?: { userType?: UserType }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: userRow } = await supabase
    .from("users")
    .select("user_type")
    .eq("id", user.id)
    .maybeSingle();
  if (!userRow) redirect("/auth");

  if (opts?.userType && userRow.user_type !== opts.userType) {
    redirect("/dashboard");
  }

  const accountLabel = user.email?.split("@")[0] ?? "You";
  const isCompany = userRow.user_type === "company";

  return {
    supabase,
    user,
    userRow,
    accountLabel,
    initials: accountLabel.slice(0, 2).toUpperCase(),
    isCompany,
  };
}
