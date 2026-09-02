"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { RelationshipStage } from "@/lib/supabase/types";
import type { RelationshipEventRow } from "@/lib/relationship/persistence";
import {
  currentStage,
  latestStage,
  loadTimeline,
  recordBoardStage,
} from "@/lib/relationship/persistence";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/components/toast/ToastProvider";

export type BoardCandidate = {
  connectionId: string;
  userId: string;
  name: string;
  subtitle: string;
  initial: string;
  timeline: RelationshipEventRow[];
};

const BOARD_COLUMNS: { id: RelationshipStage; label: string }[] = [
  { id: "connected", label: "Connected" },
  { id: "exploring", label: "Exploring" },
  { id: "in_conversation", label: "In conversation" },
  { id: "opportunity", label: "Opportunity" },
  { id: "decision", label: "Decision" },
  { id: "relationship", label: "Relationship" },
];

const STAGE_LABEL: Record<RelationshipStage, string> = Object.fromEntries(
  BOARD_COLUMNS.map((column) => [column.id, column.label]),
) as Record<RelationshipStage, string>;

type PendingRegression = {
  card: BoardCandidate;
  target: RelationshipStage;
};

export function CompanyBoardScreen({
  actorId,
  candidates: initialCandidates,
}: {
  actorId: string;
  candidates: BoardCandidate[];
}) {
  const toast = useToast();
  const [supabase] = useState(() => createClient());
  const [candidates, setCandidates] = useState(initialCandidates);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<RelationshipStage | null>(null);
  const [pending, setPending] = useState<PendingRegression | null>(null);

  const grouped = useMemo(() => {
    const buckets = new Map<RelationshipStage, BoardCandidate[]>();
    for (const column of BOARD_COLUMNS) buckets.set(column.id, []);
    for (const card of candidates) {
      const stage = latestStage(card.timeline);
      buckets.get(stage)?.push(card);
    }
    return buckets;
  }, [candidates]);

  const applyTimeline = (
    connectionId: string,
    timeline: RelationshipEventRow[],
  ) => {
    setCandidates((prev) =>
      prev.map((card) =>
        card.connectionId === connectionId ? { ...card, timeline } : card,
      ),
    );
  };

  const moveCard = async (
    card: BoardCandidate,
    target: RelationshipStage,
    allowRegression: boolean,
  ) => {
    if (busyId) return;
    setBusyId(card.connectionId);
    try {
      const result = await recordBoardStage(
        supabase,
        card.connectionId,
        card.timeline,
        target,
        actorId,
        { allowRegression },
      );
      if (result === "needs_confirmation") {
        setPending({ card, target });
        return;
      }
      if (result === "unchanged") return;
      const timeline = await loadTimeline(supabase, card.connectionId);
      applyTimeline(card.connectionId, timeline);
    } catch {
      toast("Couldn't update that stage. Try again in a moment.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleDrop = (target: RelationshipStage) => {
    const card = candidates.find((row) => row.connectionId === draggingId);
    setDraggingId(null);
    setOverStage(null);
    if (!card) return;
    void moveCard(card, target, false);
  };

  const confirmRegression = () => {
    if (!pending) return;
    const { card, target } = pending;
    setPending(null);
    void moveCard(card, target, true);
  };

  if (candidates.length === 0) {
    return (
      <div className="rounded-2xl border border-mingle-border bg-mingle-surface">
        <EmptyState
          title="No connected candidates yet"
          body="Once you and a candidate both connect, they appear on this board so you can move them through the relationship."
          actionHref="/discover"
          actionLabel="Find candidates"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-mingle-text-secondary">
        Drag a candidate to another stage, or pick a stage on the card.
        Stepping back from the furthest stage reached needs a confirmation.
      </p>

      <div className="-mx-4 overflow-x-auto px-4 sm:-mx-8 sm:px-8">
        <div className="flex min-w-max gap-3 pb-4">
          {BOARD_COLUMNS.map((column) => {
            const cards = grouped.get(column.id) ?? [];
            const isOver = overStage === column.id;
            return (
              <section
                key={column.id}
                onDragOver={(event) => {
                  event.preventDefault();
                  setOverStage(column.id);
                }}
                onDragLeave={() => {
                  setOverStage((current) =>
                    current === column.id ? null : current,
                  );
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  handleDrop(column.id);
                }}
                className={`flex w-64 shrink-0 flex-col rounded-2xl border bg-mingle-surface p-3 ${
                  isOver
                    ? "border-mingle-cta"
                    : "border-mingle-border"
                }`}
              >
                <header className="mb-3 flex items-center justify-between gap-2 px-1">
                  <h2 className="font-display text-sm font-semibold text-mingle-white">
                    {column.label}
                  </h2>
                  <span className="rounded-full bg-mingle-bg px-2 py-0.5 text-xs font-medium text-mingle-text-secondary">
                    {cards.length}
                  </span>
                </header>
                <div className="flex min-h-40 flex-col gap-2">
                  {cards.length === 0 ? (
                    <p className="px-1 text-xs text-mingle-text-secondary">
                      Drop a candidate here
                    </p>
                  ) : (
                    cards.map((card) => (
                      <article
                        key={card.connectionId}
                        draggable={busyId !== card.connectionId}
                        onDragStart={() => setDraggingId(card.connectionId)}
                        onDragEnd={() => {
                          setDraggingId(null);
                          setOverStage(null);
                        }}
                        className={`rounded-xl border border-mingle-border bg-mingle-bg p-3 ${
                          draggingId === card.connectionId ? "opacity-60" : ""
                        } ${busyId === card.connectionId ? "pointer-events-none opacity-70" : ""}`}
                      >
                        <Link
                          href={`/profile/view/${card.userId}`}
                          className="flex items-center gap-3"
                          onClick={(event) => {
                            if (draggingId) event.preventDefault();
                          }}
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-mingle-pink to-mingle-purple font-display text-xs font-bold text-white">
                            {card.initial}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-display text-sm font-semibold text-mingle-white">
                              {card.name}
                            </p>
                            <p className="truncate text-xs text-mingle-text-secondary">
                              {card.subtitle || "Candidate"}
                            </p>
                          </div>
                        </Link>
                        <div className="mt-3 flex items-center gap-2">
                          <label className="sr-only" htmlFor={`stage-${card.connectionId}`}>
                            Move {card.name}
                          </label>
                          <select
                            id={`stage-${card.connectionId}`}
                            value={latestStage(card.timeline)}
                            disabled={busyId === card.connectionId}
                            onChange={(event) => {
                              void moveCard(
                                card,
                                event.target.value as RelationshipStage,
                                false,
                              );
                            }}
                            className="min-w-0 flex-1 rounded-lg border border-mingle-border bg-mingle-surface px-2 py-1.5 text-xs text-mingle-white"
                          >
                            {BOARD_COLUMNS.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <Link
                            href={`/conversations/${card.connectionId}`}
                            className="shrink-0 rounded-full bg-mingle-cta px-3 py-1.5 font-display text-[11px] font-semibold text-mingle-white"
                          >
                            Chat
                          </Link>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {pending && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setPending(null)}
        >
          <div
            role="dialog"
            aria-labelledby="board-regression-title"
            className="w-full max-w-sm rounded-2xl border border-mingle-border bg-mingle-surface p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id="board-regression-title"
              className="font-display text-lg font-bold text-mingle-white"
            >
              Move this relationship back?
            </h2>
            <p className="mt-3 text-sm text-mingle-text-secondary">
              This connection has already reached{" "}
              {STAGE_LABEL[currentStage(pending.card.timeline)]}. Moving it to{" "}
              {STAGE_LABEL[pending.target]} goes back from the furthest stage
              reached. Confirm only if you mean to step back.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setPending(null)}
                className="rounded-full bg-mingle-bg px-5 py-2.5 font-display text-sm font-semibold text-mingle-text-secondary"
              >
                Keep{" "}
                {STAGE_LABEL[currentStage(pending.card.timeline)]}
              </button>
              <button
                type="button"
                onClick={confirmRegression}
                className="rounded-full bg-mingle-cta px-5 py-2.5 font-display text-sm font-semibold text-mingle-white"
              >
                Move to {STAGE_LABEL[pending.target]}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
