import { notFound } from "next/navigation";
import { MingleLogo } from "@/components/MingleLogo";
import { CareerPageScreen } from "@/components/careers/CareerPageScreen";
import { hasAppliedToRole, loadCareerPage } from "@/lib/careers/persistence";
import { createClient } from "@/lib/supabase/server";

export default async function CareerPage({
  params,
}: PageProps<"/careers/[companySlug]">) {
  const { companySlug } = await params;
  const supabase = await createClient();

  const career = await loadCareerPage(supabase, companySlug);
  if (!career) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let viewer: { id: string; userType: string } | null = null;
  let appliedRoleIds: string[] = [];
  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("user_type")
      .eq("id", user.id)
      .maybeSingle();
    viewer = { id: user.id, userType: profile?.user_type ?? "" };

    if (viewer.userType === "talent" && career.roles.length > 0) {
      const checks = await Promise.all(
        career.roles.map((role) => hasAppliedToRole(supabase, role.id, user.id)),
      );
      appliedRoleIds = career.roles
        .filter((_, index) => checks[index])
        .map((role) => role.id);
    }
  }

  return (
    <main className="flex min-h-screen flex-1 justify-center px-6 py-12 sm:px-10">
      <div className="flex w-full max-w-2xl flex-col gap-8">
        <div className="flex justify-center">
          <MingleLogo variant="mark" size={32} />
        </div>
        <CareerPageScreen
          career={career}
          viewer={viewer}
          appliedRoleIds={appliedRoleIds}
        />
      </div>
    </main>
  );
}
