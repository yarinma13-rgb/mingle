import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import { ContactSalesPage } from "@/components/landing/ContactSalesPage";
import { appOrigin } from "@/lib/app-origin";
import "@/components/landing/landing.css";

const figtree = Figtree({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-landing-figtree",
  display: "swap",
});

const TITLE = "Book a demo | mingle";
const DESCRIPTION =
  "Talk with the mingle team. See Top Matches, Why this match, and how near zero friction hiring intelligence works on a real open role.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${appOrigin()}/contact` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${appOrigin()}/contact`,
    siteName: "mingle",
    type: "website",
    images: [
      {
        url: `${appOrigin()}/welcome/opengraph-image`,
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
    images: [`${appOrigin()}/welcome/opengraph-image`],
  },
};

export default function ContactPage() {
  return (
    <div className={figtree.variable}>
      <ContactSalesPage />
    </div>
  );
}
