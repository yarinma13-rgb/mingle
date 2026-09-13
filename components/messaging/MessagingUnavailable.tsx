"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function MessagingUnavailable({
  connectionId,
}: {
  connectionId?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [attempts, setAttempts] = useState(0);

  return (
    <div className="rounded-2xl border border-mingle-border bg-mingle-surface p-10 text-center">
      <div
        aria-hidden
        className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-mingle-lavender text-mingle-blue"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <h3 className="font-display text-base font-semibold text-mingle-text">
        Messaging isn&apos;t ready yet
      </h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-mingle-text-secondary">
        We couldn&apos;t open this conversation. That usually clears after a
        short refresh
        {connectionId ? " — try again below." : "."}
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setAttempts((n) => n + 1);
          startTransition(() => {
            router.refresh();
          });
        }}
        className="mingle-btn-primary mt-5 text-xs disabled:opacity-60"
      >
        {pending ? "Retrying…" : attempts > 0 ? "Try again" : "Try again"}
      </button>
    </div>
  );
}
