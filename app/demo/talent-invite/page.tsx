"use client";

import { TalentInviteScreen } from "@/components/referrals/TalentInviteScreen";
import { TalentReferralCard } from "@/components/referrals/TalentReferralCard";

/**
 * Local visual preview for the talent invite UI (no auth required for layout).
 * Not linked from production nav.
 */
export default function TalentInviteDemoPage() {
  return (
    <main className="flex min-h-screen flex-col gap-10 bg-mingle-bg px-4 py-10 sm:px-8">
      <TalentInviteScreen
        friendsJoined={2}
        previewCode="demo1234"
        onDone={() => undefined}
      />
      <div className="mx-auto w-full max-w-2xl">
        <TalentReferralCard
          stats={{
            code: "demo1234",
            shareCount: 3,
            openCount: 5,
            signupStartedCount: 2,
            signedUpCount: 2,
            profileCompletedCount: 1,
            matchedCount: 0,
            friendsJoined: 2,
          }}
        />
      </div>
    </main>
  );
}
