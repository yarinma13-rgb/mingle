import type { MetadataRoute } from "next";
import { appOrigin } from "@/lib/app-origin";
import { listCareerPages } from "@/lib/careers/persistence";
import { createClient } from "@/lib/supabase/server";

const STATIC_PAGES: MetadataRoute.Sitemap = [
  { url: "/welcome", changeFrequency: "weekly", priority: 1 },
  { url: "/careers", changeFrequency: "daily", priority: 0.8 },
  { url: "/contact", changeFrequency: "monthly", priority: 0.6 },
  { url: "/legal/terms", changeFrequency: "yearly", priority: 0.2 },
  { url: "/legal/privacy", changeFrequency: "yearly", priority: 0.2 },
  ];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = appOrigin();
  const now = new Date();

const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map((page) => ({
  ...page,
  url: `${origin}${page.url}`,
  lastModified: now,
}));

const supabase = await createClient();
  const companies = await listCareerPages(supabase);
  const careerEntries: MetadataRoute.Sitemap = companies.map((company) => ({
    url: `${origin}/careers/${company.slug}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.7,
  }));

return [...staticEntries, ...careerEntries];
}
