"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MessagingFailureKind } from "@/lib/messaging/errors";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const COPY: Record<
  MessagingFailureKind,
  { title: string; body: string }
> = {
  not_accepted: {
    title: "Connection isn’t open for chat yet",
    body: "Messaging unlocks after both sides connect. Head back to Connections and accept the request first.",
  },
  missing_schema: {
    title: "Messaging isn’t wired up yet",
    body: "Messaging is not available right now. Refresh in a moment, or contact support if this keeps happening.",
  },
  permission: {
    title: "Can’t open this conversation",
    body: "You don’t have access to this thread right now. Refresh once, or return to Connections and open it again from there.",
  },
  unknown: {
    title: "Messaging isn’t ready yet",
    body: "We couldn’t open this conversation. That usually clears after a short refresh — try again below.",
  },
};

export function MessagingUnavailable({
  connectionId,
  kind = "unknown",
}: {
  connectionId?: string;
  kind?: MessagingFailureKind;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [attempts, setAttempts] = useState(0);
  const autoTried = useRef(false);
  const copy = COPY[kind];

  useEffect(() => {
    if (autoTried.current || kind === "not_accepted" || kind === "missing_schema") {
      return;
    }
    autoTried.current = true;
    const timer = window.setTimeout(() => {
      setAttempts(1);
      startTransition(() => {
        router.refresh();
      });
    }, 900);
    return () => window.clearTimeout(timer);
  }, [kind, router]);

  return (
    <Card className="p-10 text-center">
      <div
        aria-hidden
        className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-mingle-lavender text-mingle-accent-purple"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <h3 className="font-display text-base font-semibold tracking-tight text-mingle-text">
        {copy.title}
      </h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-mingle-text-secondary">
        {copy.body}
        {connectionId && kind === "unknown" ? " Use Try again below." : null}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <Button
          type="button"
          size="sm"
          disabled={pending}
          onClick={() => {
            setAttempts((n) => n + 1);
            startTransition(() => {
              router.refresh();
            });
          }}
        >
          {pending ? "Retrying…" : "Try again"}
        </Button>
        <Button href="/connections" variant="secondary" size="sm">
          Back to Connections
        </Button>
      </div>
    </Card>
  );
}
