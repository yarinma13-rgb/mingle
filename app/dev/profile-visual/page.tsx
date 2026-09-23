import { ProfileScene } from "@/components/demo/scenes/ProfileScene";

/**
 * Local visual QA for the Talent Profile + Match Report layout.
 * Not linked from product nav.
 */
export default function ProfileVisualPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f7f4ff] via-[#faf8fc] to-[#eef4ff] px-4 py-10 sm:px-8">
      <ProfileScene />
    </main>
  );
}
