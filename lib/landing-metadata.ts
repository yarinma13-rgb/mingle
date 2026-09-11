import type { Metadata } from "next";
import { appOrigin } from "@/lib/app-origin";

const TITLE = "mingle | The right people, faster";
const DESCRIPTION =
  "Post a job. Get the right people. Understand why. mingle helps recruiters find the few people worth talking to in seconds.";

/** Shareable campaign landing for LinkedIn, Instagram, and ads. */
export const LANDING_PATH = "/welcome";

export function landingMetadata(): Metadata {
  const origin = appOrigin();
  const url = `${origin}${LANDING_PATH}`;

  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: url },
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      url,
      siteName: "mingle",
      type: "website",
      locale: "en_US",
      images: [
        {
          url: `${origin}/welcome/opengraph-image`,
          width: 1200,
          height: 630,
          alt: "mingle — Post a job. Get the right people. Understand why.",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: TITLE,
      description: DESCRIPTION,
      images: [`${origin}/welcome/opengraph-image`],
    },
  };
}
