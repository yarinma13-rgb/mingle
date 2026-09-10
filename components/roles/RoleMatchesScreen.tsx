"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/Avatar";
import {
  MatchFeedbackActions,
  MatchReportBody,
} from "@/components/matching/MatchReport";
import { passProfile } from "@/lib/matching/passed";
import { saveProfile } from "@/lib/matching/saved";
import {
  recordMatchFeedback,
  type MatchFeedbackAction,
  type NotFitReason,
} from "@/lib/matching/feedback";
import { useToast } from "@/components/toast/ToastProvider";
import type { DiscoveryCard } from "@/components/discovery/DiscoveryScreen";

const TOP_N = 5;

function ResultCard({
  card,
  viewerId,
  initialFeedback,
  onPass,
}: {
  card: DiscoveryCard;
  viewerId: string;
  initialFeedback: MatchFeedbackAction | null;
  onPass: (userId: string) => void;
}) {
  const toast = useToast();
  const [supabase] = useState(() => createClient());
  const [feedback, setFeedback] = useState(initialFeedback);
  const [busy, setBusy] = useState(false);

  async function interested() {
    if (feedback === "interested") return;
    setBusy(true);
    try {
      await saveProfile(supabase, viewerId, card.userId);
      await recordMatchFeedback(supabase, viewerId, card.userId, "interested");
      setFeedback("interested");
      toast("Marked interested.");
    } catch {
      toast("Couldn't save that. Try again in a moment.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function notFit(reason: NotFitReason) {
    setBusy(true);
    try {
      await recordMatchFeedback(
        supabase,
        viewerId,
        card.userId,
        "not_fit",
        reason,
      );
      setFeedback("not_fit");
      onPass(card.userId);
    } catch {
      toast("Couldn't save that. Try again in a moment.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-mingle-border bg-mingle-surface p-5">
      <div className="flex items-center gap-3">
        <Avatar
          photo={card.photo}
          initials={card.initial}
          gender={card.gender}
          size="md"
        />
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-semibold text-mingle-text">
            {card.name}
          </p>
          <p className="truncate text-xs text-mingle-text-secondary">
            {card.subtitle}
          </p>
        </div>
      </div>
      <MatchReportBody report={card.report} compact />
      <div className="flex flex-col gap-2">
        <Link
          href={`/profile/view/${card.userId}`}
          className="self-start rounded-full bg-mingle-cta px-4 py-2 font-display text-xs font-semibold text-white"
        >
          View profile
        </Link>
        <MatchFeedbackActions
          audience="company"
          action={feedback}
          busy={busy}
          onInterested={() => void interested()}
          onNotFit={(reason) => void notFit(reason)}
        />
      </div>
    </article>
  );
}

export function RoleMatchesScreen({
  roleId,
  roleTitle,
  cards,
  total,
  viewerId,
  feedbackByUser,
  filters,
}: {
  roleId: string;
  roleTitle: string;
  cards: DiscoveryCard[];
  total: number;
  viewerId: string;
  feedbackByUser: Record<string, MatchFeedbackAction>;
  filters: React.ReactNode;
}) {
  const router = useRouter();
  const toast = useToast();
  const [supabase] = useState(() => createClient());
  const [hidden, setHidden] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);
  const visible = cards.filter((card) => !hidden.includes(card.userId));
  const listed = showAll ? visible : visible.slice(0, TOP_N);

  async function persistPass(userId: string) {
    try {
      await passProfile(supabase, viewerId, userId);
    } catch {
      toast("Couldn't save that skip.", "error");
    }
    setHidden((prev) => [...prev, userId]);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/roles"
          className="text-xs font-semibold text-mingle-text-secondary hover:text-mingle-text"
        >
          Back to roles
        </Link>
        <h2 className="mt-2 font-display text-xl font-semibold text-mingle-text">
          {roleTitle}
        </h2>
        <p className="mt-1 text-sm text-mingle-text-secondary">
          {total} strong matches. Top {Math.min(TOP_N, visible.length)} shown
          first, from everyone on mingle. Location stays a soft signal.
        </p>
        <p className="mt-1 text-xs font-semibold text-mingle-text-secondary">
          Sort: Best Match
        </p>
      </div>
      {filters}
      {listed.length === 0 ? (
        <p className="text-sm text-mingle-text-secondary">
          Nobody to rank yet. Invite talent onto mingle, or check Passed.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {listed.map((card) => (
            <ResultCard
              key={card.userId}
              card={card}
              viewerId={viewerId}
              initialFeedback={feedbackByUser[card.userId] ?? null}
              onPass={persistPass}
            />
          ))}
        </div>
      )}
      {!showAll && visible.length > TOP_N ? (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="self-start text-sm font-semibold text-mingle-text-secondary hover:text-mingle-text"
        >
          View all matches
        </button>
      ) : null}
      <Link
        href={`/roles/${roleId}`}
        className="text-xs text-mingle-text-secondary hover:text-mingle-text"
      >
        People already in your pipeline
      </Link>
    </div>
  );
}
