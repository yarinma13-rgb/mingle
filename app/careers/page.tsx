import type { Metadata } from "next";
import Link from "next/link";
import { MingleLogo } from "@/components/MingleLogo";
import { Card } from "@/components/ui/Card";
import { listCareerPages, loadCareerPage } from "@/lib/careers/persistence";
import { createClient } from "@/lib/supabase/server";
import { appOrigin } from "@/lib/app-origin";

const TITLE = "Open roles on mingle | mingle";
const DESCRIPTION =
  "Browse companies hiring on mingle right now. See every open role and find out why you'd match, before you apply.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${appOrigin()}/careers` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${appOrigin()}/careers`,
    siteName: "mingle",
    type: "website",
  },
};

export default async function CareersDirectoryPage() {
  const supabase = await createClient();
  const listings = await listCareerPages(supabase);
  const companies = (
    await Promise.all(
      listings.map(async (listing) => {
        const career = await loadCareerPage(supabase, listing.slug);
        if (!career) return null;
        return { slug: listing.slug, ...career };
      }),
    )
  ).filter((company): company is NonNullable<typeof company> => company !== null);

  return (
    <main className="flex min-h-screen flex-1 justify-center px-6 py-12 sm:px-10">
      <div className="flex w-full max-w-2xl flex-col gap-8">
        <div className="flex justify-center">
          <MingleLogo variant="mark" size={32} />
        </div>
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-semibold text-mingle-text">
            Companies hiring on mingle
          </h1>
          <p className="text-mingle-text-muted">
            {companies.length > 0
              ? "Pick a company to see their open roles and why you might match."
              : "No open roles yet — check back soon."}
          </p>
        </div>
        <div className="flex flex-col gap-4">
          {companies.map((company) => (
            <Link key={company.slug} href={`/careers/${company.slug}`}>
              <Card interactive className="flex items-center justify-between gap-4 p-5">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-mingle-text">
                    {company.companyName}
                  </span>
                  {(company.industry || company.location) && (
                    <span className="text-sm text-mingle-text-muted">
                      {[company.industry, company.location]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium text-mingle-text-muted">
                  {company.roles.length} open role
                  {company.roles.length === 1 ? "" : "s"}
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
