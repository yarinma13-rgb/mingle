"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { acceptConnection, declineConnection } from "@/lib/connections/persistence";
import { MingleMomentOverlay } from "@/components/mingle-moment/MingleMomentOverlay";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/components/toast/ToastProvider";

export type ConnectionDisplayRow = {
  connectionId: string;
  userId: string;
  name: string;
  subtitle: string;
  initial: string;
};

function PersonRow({
  row,
  children,
}: {
  row: ConnectionDisplayRow;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-stretch justify-between gap-3 rounded-xl border border-mingle-border bg-mingle-bg p-4 sm:flex-row sm:items-center sm:gap-4">
      <Link
        href={`/profile/view/${row.userId}`}
        className="flex min-w-0 items-center gap-3"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-mingle-pink to-mingle-purple font-display text-sm font-bold text-white">
          {row.initial}
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-semibold text-mingle-white">
            {row.name}
          </p>
          <p className="truncate text-xs text-mingle-text-secondary">
            {row.subtitle}
          </p>
        </div>
      </Link>
      {children ? (
        <div className="flex w-full justify-end sm:w-auto">{children}</div>
      ) : null}
    </div>
  );
}

export function ConnectionsScreen({
  incoming: initialIncoming,
  outgoing,
  accepted: initialAccepted,
}: {
  incoming: ConnectionDisplayRow[];
  outgoing: ConnectionDisplayRow[];
  accepted: ConnectionDisplayRow[];
}) {
  const toast = useToast();
  const [supabase] = useState(() => createClient());
  const [incoming, setIncoming] = useState(initialIncoming);
  const [accepted, setAccepted] = useState(initialAccepted);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [mingleMatch, setMingleMatch] = useState<ConnectionDisplayRow | null>(null);

  const handleAccept = async (row: ConnectionDisplayRow) => {
    setBusyId(row.connectionId);
    try {
      await acceptConnection(supabase, row.connectionId);
      setIncoming((prev) => prev.filter((r) => r.connectionId !== row.connectionId));
      setAccepted((prev) => [row, ...prev]);
      setMingleMatch(row);
    } catch {
      toast("Couldn't accept that. Try again in a moment.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleDecline = async (row: ConnectionDisplayRow) => {
    setBusyId(row.connectionId);
    try {
      await declineConnection(supabase, row.connectionId);
      setIncoming((prev) => prev.filter((r) => r.connectionId !== row.connectionId));
      toast("You passed on this request for now.");
    } catch {
      toast("Couldn't update that. Try again in a moment.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const nothingYet =
    incoming.length === 0 && outgoing.length === 0 && accepted.length === 0;

  return (
    <div className="flex flex-col gap-6">
      {mingleMatch && (
        <MingleMomentOverlay
          matchName={mingleMatch.name}
          matchUserId={mingleMatch.userId}
          onClose={() => setMingleMatch(null)}
        />
      )}

      {nothingYet ? (
        <div className="rounded-2xl border border-mingle-border bg-mingle-surface">
          <EmptyState
            title="No connections yet"
            body="When you find someone worth knowing, send a request. Mutual interest is when the relationship actually starts."
            actionHref="/discover"
            actionLabel="Discover people"
          />
        </div>
      ) : (
        <>
      <div className="rounded-2xl border border-mingle-border bg-mingle-surface p-6">
        <h2 className="font-display text-sm font-semibold text-mingle-white">
          Requests you&rsquo;ve received
        </h2>
        {incoming.length === 0 ? (
          <p className="mt-3 text-sm text-mingle-text-secondary">
            No pending requests right now.
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {incoming.map((row) => (
              <PersonRow key={row.connectionId} row={row}>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAccept(row)}
                    disabled={busyId === row.connectionId}
                    className="rounded-full bg-mingle-cta px-4 py-2 font-display text-xs font-semibold text-mingle-white disabled:opacity-60"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecline(row)}
                    disabled={busyId === row.connectionId}
                    className="rounded-full bg-mingle-bg px-4 py-2 font-display text-xs font-semibold text-mingle-text-secondary hover:text-mingle-white disabled:opacity-60"
                  >
                    Decline
                  </button>
                </div>
              </PersonRow>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-mingle-border bg-mingle-surface p-6">
        <h2 className="font-display text-sm font-semibold text-mingle-white">
          Sent
        </h2>
        {outgoing.length === 0 ? (
          <p className="mt-3 text-sm text-mingle-text-secondary">
            You haven&rsquo;t sent any requests yet.
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {outgoing.map((row) => (
              <PersonRow key={row.connectionId} row={row}>
                <span className="shrink-0 rounded-full bg-mingle-bg px-3 py-1.5 text-xs font-medium text-mingle-text-secondary">
                  Pending
                </span>
              </PersonRow>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-mingle-border bg-mingle-surface p-6">
        <h2 className="font-display text-sm font-semibold text-mingle-white">
          Your connections
        </h2>
        {accepted.length === 0 ? (
          <p className="mt-3 text-sm text-mingle-text-secondary">
            No connections yet. Once you and someone else both express
            interest, they&rsquo;ll show up here.
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {accepted.map((row) => (
              <PersonRow key={row.connectionId} row={row}>
                <Link
                  href={`/conversations/${row.connectionId}`}
                  className="shrink-0 rounded-full bg-mingle-cta px-4 py-2 font-display text-xs font-semibold text-mingle-white"
                >
                  Message
                </Link>
              </PersonRow>
            ))}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}
