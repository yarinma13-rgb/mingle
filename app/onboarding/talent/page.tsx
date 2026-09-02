import { OnboardingWizard } from "@/components/OnboardingWizard";

export default function TalentOnboardingPage() {
  return (
    <main className="flex min-h-screen flex-1 flex-col">
      <OnboardingWizard path="talent" />
    </main>
  );
}
