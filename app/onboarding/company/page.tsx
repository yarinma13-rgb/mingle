import { OnboardingWizard } from "@/components/OnboardingWizard";

export default function CompanyOnboardingPage() {
  return (
    <main className="flex min-h-screen flex-1 flex-col">
      <OnboardingWizard path="company" />
    </main>
  );
}
