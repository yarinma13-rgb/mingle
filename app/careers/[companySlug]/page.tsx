import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MingleLogo } from "@/components/MingleLogo";
import { CareerPageScreen } from "@/components/careers/CareerPageScreen";
import { hasAppliedToRole, loadCareerPage } from "@/lib/careers/persistence";
import { createClient } from "@/lib/supabase/server";
import { appOrigin } from "@/lib/app-origin";

export async function generateMetadata({
  params,
}: PageProps<"/careers/[companySlug]">): Promise<Metadata> {
  const { companySlug } = await params;
  const supabase = await createClient();
  const career = await loadCareerPage(supabase, companySlug);
  if (!career) return {};

  const origin = appOrigin();
  const url = `${origin}/careers/${companySlug}`;
  const roleCount = career.roles.length;
  const title = `Careers at ${career.companyName} | mingle`;
  const description =
    career.description?.trim() ||
    (roleCount > 0
      ? `${career.companyName} is hiring${career.location ? ` in ${career.location}` : ""}. See ${roleCount} open role${roleCount === 1 ? "" : "s"} and find out why you match, on mingle.`
      : `${career.companyName} on mingle — the career relationship platform that explains why you match before you apply.`);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "mingle",
      type: "website",
      ...(career.logo ? { images: [{ url: career.logo }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(career.logo ? { images: [career.logo] } : {}),
    },
  };
}

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

  const origin = appOrigin();
  // JobPosting `datePosted` is intentionally omitted: the underlying RPC
  // (career_page_by_slug) doesn't currently surface each role's created_at,
  // so we can't report a real posted date without guessing. Add it there
  // first if Google Jobs rich-result eligibility is a priority.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: career.companyName,
        url: `${origin}/careers/${companySlug}`,
        ...(career.logo ? { logo: career.logo } : {}),
      },
      ...career.roles.map((role) => ({
        "@type": "JobPosting",
        title: role.title,
        description:
          career.description?.trim() || `${role.title} at ${career.companyName}`,
        hiringOrganization: {
          "@type": "Organization",
          name: career.companyName,
          ...(career.logo ? { logo: career.logo } : {}),
        },
        ...(career.location
          ? { jobLocation: { "@type": "Place", address: career.location } }
          : {}),
      })),
    ],
  };

  return (
    <main className="flex min-h-screen flex-1 justify-center px-6 py-12 sm:px-10">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
