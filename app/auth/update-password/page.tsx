import { MingleLogo } from "@/components/MingleLogo";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function UpdatePasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center px-6 py-16 sm:px-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <MingleLogo variant="mark" size={40} className="mb-6" />
          <h1 className="font-display text-2xl font-bold text-mingle-text">
            Set a new password
          </h1>
          <p className="mt-2 text-sm text-mingle-text-secondary">
            Choose a password for {user.email}.
          </p>
        </div>
        <div className="rounded-2xl border border-mingle-border bg-mingle-white p-6">
          <ChangePasswordForm title="New password" />
        </div>
      </div>
    </div>
  );
}
