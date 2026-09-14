"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { acceptConnection, declineConnection } from "@/lib/connections/persistence";
import { notifyPushConnection } from "@/lib/push/actions";
import { EmptyState } from "@/components/EmptyState";
import { MingleChip } from "@/components/MingleChip";
import { StatusChip } from "@/components/StatusChip";
import { useToast } from "@/components/toast/ToastProvider";
import { Avatar } from "@/components/Avatar";
import { CompanyPipelineFunnel } from "@/components/dashboard/CompanyPipelineFunnel";
import { CompanyPipelineDonut } from "@/components/dashboard/CompanyPipelineDonut";
import {
  FUNNEL_STAGES,
  funnelFromStages,
} from "@/lib/dashboard/funnel";
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

function PersonRow({
  row,
  children,
  accent,
}: {
  row: ConnectionDisplayRow;
  children?: React.ReactNode;
  /** Left color bar grouping: New / In conversation / Saved. */
  accent?: "new" | "conversation" | "saved";
}) {
  const barClass =
    accent === "new"
      ? "border-l-[3px] border-l-mingle-success"
      : accent === "conversation"
        ? "border-l-[3px] border-l-mingle-accent-blue"
        : accent === "saved"
          ? "border-l-[3px] border-l-mingle-accent-purple"
          : "";
  return (
    <div
      className={`flex flex-col items-stretch justify-between gap-3 rounded-xl border border-mingle-border bg-mingle-bg p-4 sm:flex-row sm:items-center sm:gap-4 ${barClass}`}
    >
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
      void notifyPushConnection(row.userId);
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

  const newAccepted = accepted.filter(
    (row) => !row.stage || row.stage === "connected" || row.stage === "exploring",
  );
  const conversationAccepted = accepted.filter(
    (row) =>
      row.stage === "in_conversation" ||
      row.stage === "interview_booked" ||
      row.stage === "opportunity" ||
      row.stage === "decision" ||
      row.stage === "relationship",
  );

  const pipelineFunnel = useMemo(
    () => funnelFromStages(accepted.map((row) => row.stage)),
    [accepted],
  );

  const acceptedByStage = useMemo(() => {
    const buckets = new Map<RelationshipStage, ConnectionDisplayRow[]>();
    for (const stage of FUNNEL_STAGES) buckets.set(stage.id, []);
    for (const row of accepted) {
      buckets.get(row.stage ?? "connected")?.push(row);
    }
    return buckets;
  }, [accepted]);

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
                      <StatusChip kind="pending" className="shrink-0" />
                    </PersonRow>
                  ))}
                </div>
              )}
            </div>
          </div>
          {accepted.length === 0 ? (
            <div className="rounded-2xl border border-mingle-border bg-mingle-surface p-5 shadow-mingle">
              <h2 className="font-display text-sm font-semibold text-mingle-text">
                By stage
              </h2>
              <p className="mt-3 text-sm text-mingle-text-secondary">
                After you accept someone, they land here as a snapshot. Move
                stages on the board.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <CompanyPipelineFunnel funnel={pipelineFunnel} />
                <CompanyPipelineDonut funnel={pipelineFunnel} />
              </div>
              <div className="rounded-2xl border border-mingle-border bg-mingle-surface p-5 shadow-mingle">
                <h2 className="font-display text-sm font-semibold text-mingle-text">
                  By stage
                </h2>
                <p className="mt-1 text-xs text-mingle-text-secondary">
                  Read only. Open the board to drag someone to a new stage.
                </p>
                <div className="mt-4 flex flex-col gap-6">
                  {FUNNEL_STAGES.map((stage) => {
                    const cards = acceptedByStage.get(stage.id) ?? [];
                    return (
                      <section key={stage.id}>
                        <h3 className="flex items-center justify-between gap-2 border-b border-mingle-border pb-2 font-display text-sm font-semibold text-mingle-text">
                          {stage.label}
                          <span className="text-xs font-medium text-mingle-text-secondary">
                            {cards.length}
                          </span>
                        </h3>
                        {cards.length === 0 ? (
                          <p className="mt-3 text-xs text-mingle-text-secondary">
                            No one at this stage
                          </p>
                        ) : (
                          <div className="mt-3 flex flex-col gap-3">
                            {cards.map((row) => (
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
                      </section>
                    );
                  })}
                </div>
              </div>
            </>
          )}
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
              <PersonRow key={row.connectionId} row={row} accent="new">
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
                <StatusChip kind="pending" className="shrink-0" />
              </PersonRow>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-mingle-border bg-mingle-surface p-6">
        <h2 className="font-display text-sm font-semibold text-mingle-text">
          New
        </h2>
        <p className="mt-1 text-xs text-mingle-text-secondary">
          Fresh connections still warming up.
        </p>
        {newAccepted.length === 0 ? (
          <p className="mt-3 text-sm text-mingle-text-secondary">
            No new connections right now.
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {newAccepted.map((row) => (
              <PersonRow key={row.connectionId} row={row} accent="new">
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

      <div className="rounded-2xl border border-mingle-border bg-mingle-surface p-6">
        <h2 className="font-display text-sm font-semibold text-mingle-text">
          In conversation
        </h2>
        <p className="mt-1 text-xs text-mingle-text-secondary">
          People you&rsquo;re actively talking with.
        </p>
        {conversationAccepted.length === 0 ? (
          <p className="mt-3 text-sm text-mingle-text-secondary">
            No active conversations in this list yet.
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {conversationAccepted.map((row) => (
              <PersonRow key={row.connectionId} row={row} accent="conversation">
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

      <div className="rounded-2xl border border-mingle-border bg-mingle-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-sm font-semibold text-mingle-text">
            Saved
          </h2>
          <Link
            href="/saved"
            className="text-xs font-medium text-mingle-accent-blue hover:underline"
          >
            Open saved
          </Link>
        </div>
        <p className="mt-1 text-xs text-mingle-text-secondary">
          Profiles you bookmarked for later live on Saved.
        </p>
        <div className="mt-4">
          <PersonRow
            accent="saved"
            row={{
              connectionId: "saved-link",
              userId: "saved",
              name: "Your saved list",
              subtitle: "Jump to everyone you bookmarked",
              initial: "★",
              photo: null,
              gender: null,
            }}
          >
            <Link
              href="/saved"
              className="shrink-0 rounded-full bg-mingle-lavender px-4 py-2 font-display text-xs font-semibold text-mingle-text"
            >
              View saved
            </Link>
          </PersonRow>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
