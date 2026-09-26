import { Suspense } from "react";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { CareerApplyBeacon } from "@/components/analytics/CareerApplyBeacon";

export default function TalentOnboardingPage() {
  return (
    <main className="flex min-h-screen flex-1 flex-col">
      <Suspense fallback={null}>
        <CareerApplyBeacon />
      </Suspense>
      <OnboardingWizard path="talent" />
    </main>
  );
}
