import { Suspense } from "react";
import { LandingPage } from "@/components/landing/LandingPage";
import { OutboundInterestBeacon } from "@/components/analytics/OutboundInterestBeacon";
import { landingMetadata } from "@/lib/landing-metadata";
import { redirectIfAuthenticated } from "@/lib/auth/redirect-if-authed";

export const metadata = landingMetadata();

/** Dedicated share URL for LinkedIn, Instagram, and campaigns. */
export default async function WelcomeLandingPage() {
  await redirectIfAuthenticated();
  return (
    <>
      <Suspense fallback={null}>
        <OutboundInterestBeacon />
      </Suspense>
      <LandingPage />
    </>
  );
}
