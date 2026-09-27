import type { MetadataRoute } from "next";
import { appOrigin } from "@/lib/app-origin";

export default function robots(): MetadataRoute.Robots {
  const origin = appOrigin();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth",
          "/start",
          "/onboarding",
          "/profile",
          "/company-profile",
          "/dashboard",
          "/discover",
          "/connections",
          "/conversations",
          "/board",
          "/settings",
          "/roles",
          "/interviews",
          "/team",
          "/saved",
          "/coming-soon",
          "/admin",
          "/demo/mascot",
          "/recommend",
        ],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
  };
}
