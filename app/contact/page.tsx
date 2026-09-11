import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { ContactSalesPage } from "@/components/landing/ContactSalesPage";
import { appOrigin } from "@/lib/app-origin";
import "@/components/landing/landing.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-landing-poppins",
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
  },
};

export default function ContactPage() {
  return (
    <div className={poppins.variable}>
      <ContactSalesPage />
    </div>
  );
}
