import { LandingPage } from "@/components/landing/LandingPage";
import { landingMetadata } from "@/lib/landing-metadata";

export const metadata = landingMetadata();

/** Dedicated share URL for LinkedIn, Instagram, and campaigns. */
export default function WelcomeLandingPage() {
  return <LandingPage />;
}
