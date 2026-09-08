"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { claimCompanyInviteAction } from "@/lib/team/claim-action";
import { MingleLogo } from "@/components/MingleLogo";
import type { PendingInvite } from "@/lib/team/persistence";

export function JoinTeamOffer({
  invite,
  onSkip,
}: {
  invite: PendingInvite;
  onSkip: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const join = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await claimCompanyInviteAction();
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center px-6 py-16 text-center sm:px-10">
      <MingleLogo variant="mark" size={50} className="mb-8" />
      <h1 className="font-display text-2xl font-bold text-mingle-text">
        Join the team at {invite.companyName}
      </h1>
      <p className="mt-3 max-w-sm text-sm text-mingle-text-secondary">
        This email already has an invite. Join that workspace instead of creating
        a new company profile.
      </p>
      {error ? <p className="mt-4 text-sm text-mingle-pink">{error}</p> : null}
      <button
        type="button"
        onClick={() => void join()}
        disabled={busy}
        className="mingle-btn-primary mt-8 disabled:opacity-60"
      >
        {busy ? "Joining…" : `Join the team at ${invite.companyName}`}
      </button>
      <button
        type="button"
        onClick={onSkip}
        className="mt-4 text-sm font-semibold text-mingle-text-secondary hover:text-mingle-text"
      >
        Continue with my own company
      </button>
    </div>
  );
}
