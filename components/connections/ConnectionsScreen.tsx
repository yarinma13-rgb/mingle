"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { acceptConnection, declineConnection } from "@/lib/connections/persistence";
import { EmptyState } from "@/components/EmptyState";
import { MingleChip } from "@/components/MingleChip";
import { useToast } from "@/components/toast/ToastProvider";
import { Avatar } from "@/components/Avatar";
import type { Gender } from "@/lib/profile/avatar";
import type { RelationshipStage } from "@/lib/supabase/types";

const MingleMomentOverlay = dynamic(
  () =>
    import("@/components/mingle-moment/MingleMomentOverlay").then((mod) => ({
      default: mod.MingleMomentOverlay,
    })),
  { ssr: false },
);

export type ConnectionDisplayRow = {
  connectionId: string;
  userId: string;
  name: string;
  subtitle: string;
  initial: string;
  photo: string | null;
  gender: Gender | null;
  stage?: RelationshipStage;
};

const PIPELINE_COLUMNS: { id: RelationshipStage; label: string; accent: string }[] = [
  { id: "connected", label: "Connected", accent: "var(--mingle-accent-pink)" },
  { id: "exploring", label: "Exploring", accent: "var(--mingle-accent-purple)" },
  { id: "in_conversation", label: "In conversation", accent: "var(--mingle-accent-blue)" },
  { id: "opportunity", label: "Opportunity", accent: "var(--mingle-warning)" },
  { id: "decision", label: "Decision", accent: "var(--mingle-success)" },
  { id: "relationship", label: "Relationship", accent: "var(--mingle-purple)" },
];

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
        <Avatar
          photo={row.photo}
          initials={row.initial}
          gender={row.gender}
          size="md"
        />
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-semibold text-mingle-text">
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
  variant = "connections",
}: {
  incoming: ConnectionDisplayRow[];
  outgoing: ConnectionDisplayRow[];
  accepted: ConnectionDisplayRow[];
  variant?: "connections" | "pipeline";
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
      setAccepted((prev) => [{ ...row, stage: "connected" }, ...prev]);
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
          connectionId={mingleMatch.connectionId}
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
      ) : variant === "pipeline" ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-mingle-border bg-mingle-surface p-5 shadow-mingle">
              <h2 className="font-display text-sm font-semibold text-mingle-text">
                Incoming requests
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
                          className="rounded-full bg-mingle-cta px-4 py-2 font-display text-xs font-semibold text-white disabled:opacity-60"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDecline(row)}
                          disabled={busyId === row.connectionId}
                          className="rounded-full bg-mingle-bg px-4 py-2 font-display text-xs font-semibold text-mingle-text-secondary hover:text-mingle-text disabled:opacity-60"
                        >
                          Decline
                        </button>
                      </div>
                    </PersonRow>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-2xl border border-mingle-border bg-mingle-surface p-5 shadow-mingle">
              <h2 className="font-display text-sm font-semibold text-mingle-text">
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
                      <MingleChip className="shrink-0">Pending</MingleChip>
                    </PersonRow>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="-mx-4 overflow-x-auto px-4 sm:-mx-8 sm:px-8">
            <div className="flex min-w-max gap-3 pb-2">
              {PIPELINE_COLUMNS.map((column) => {
                const cards = accepted.filter(
                  (row) => (row.stage ?? "connected") === column.id,
                );
                return (
                  <section
                    key={column.id}
                    className="flex w-64 shrink-0 flex-col rounded-2xl border border-mingle-border bg-mingle-surface p-3 shadow-mingle"
                  >
                    <header className="mb-3 flex items-center justify-between gap-2 border-b border-mingle-border px-1 pb-2">
                      <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-mingle-text">
                        <span
                          aria-hidden
                          className="h-2 w-2 rounded-full"
                          style={{ background: column.accent }}
                        />
                        {column.label}
                      </h2>
                      <MingleChip>{cards.length}</MingleChip>
                    </header>
                    <div className="flex min-h-36 flex-col gap-2">
                      {cards.length === 0 ? (
                        <p className="px-1 text-xs text-mingle-text-secondary">
                          No one at this stage
                        </p>
                      ) : (
                        cards.map((row) => (
                          <Link
                            key={row.connectionId}
                            href={`/conversations/${row.connectionId}`}
                            className="rounded-xl border border-mingle-border bg-mingle-bg p-3 transition-shadow hover:shadow-mingle"
                          >
                            <p className="truncate font-display text-sm font-semibold text-mingle-text">
                              {row.name}
                            </p>
                            <p className="truncate text-xs text-mingle-text-secondary">
                              {row.subtitle}
                            </p>
                          </Link>
                        ))
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <>
      <div className="rounded-2xl border border-mingle-border bg-mingle-surface p-6">
        <h2 className="font-display text-sm font-semibold text-mingle-text">
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
                    className="rounded-full bg-mingle-cta px-4 py-2 font-display text-xs font-semibold text-white disabled:opacity-60"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecline(row)}
                    disabled={busyId === row.connectionId}
                    className="rounded-full bg-mingle-bg px-4 py-2 font-display text-xs font-semibold text-mingle-text-secondary hover:text-mingle-text disabled:opacity-60"
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
        <h2 className="font-display text-sm font-semibold text-mingle-text">
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
                <MingleChip className="shrink-0">Pending</MingleChip>
              </PersonRow>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-mingle-border bg-mingle-surface p-6">
        <h2 className="font-display text-sm font-semibold text-mingle-text">
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
                  className="shrink-0 rounded-full bg-mingle-cta px-4 py-2 font-display text-xs font-semibold text-white"
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
