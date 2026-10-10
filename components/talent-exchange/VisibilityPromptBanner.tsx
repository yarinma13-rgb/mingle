"use client";

import { useState } from "react";
import { CandidateVisibilityControl } from "@/components/settings/CandidateVisibilityControl";
import type { CandidateVisibilityStatus } from "@/lib/talent-exchange/persistence";

export function VisibilityPromptBanner({
  candidateId,
  opportunityCount,
}: {
  candidateId: string;
  opportunityCount: number;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [chosen, setChosen] = useState(false);

  if (dismissed) return null;

  return (
    <div className="rounded-2xl border border-mingle-border bg-mingle-white p-5 shadow-mingle">
      <p className="font-display text-base font-semibold text-mingle-text">
        Your application is closed — but your opportunities don&apos;t have to
        be.
      </p>
      <p className="mt-1 text-sm text-mingle-text-secondary">
        We found {opportunityCount} {opportunityCount === 1 ? "company" : "companies"}{" "}
        that may be a strong match for your profile. Choose how discoverable
        you&apos;d like to be.
      </p>
      <div className="mt-4">
        <CandidateVisibilityControlWithDismiss
          candidateId={candidateId}
          onChosen={() => setChosen(true)}
        />
      </div>
      {chosen ? (
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="mingle-btn-secondary mt-4 text-xs"
        >
          Done
        </button>
      ) : null}
    </div>
  );
}

// Thin wrapper: CandidateVisibilityControl already saves on every choice,
// this just notifies the banner so it can surface a "Done" button instead
// of guessing when the candidate is finished deciding.
function CandidateVisibilityControlWithDismiss({
  candidateId,
  onChosen,
}: {
  candidateId: string;
  onChosen: () => void;
}) {
  return (
    <div onClickCapture={onChosen}>
      <CandidateVisibilityControl
        candidateId={candidateId}
        initialStatus={"private" as CandidateVisibilityStatus}
      />
    </div>
  );
}
