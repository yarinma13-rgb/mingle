import { LandingPage } from "@/components/landing/LandingPage";
import { landingMetadata } from "@/lib/landing-metadata";
import { redirectIfAuthenticated } from "@/lib/auth/redirect-if-authed";

export const metadata = landingMetadata();

export default async function Home() {
  await redirectIfAuthenticated();
  return <LandingPage />;
}
