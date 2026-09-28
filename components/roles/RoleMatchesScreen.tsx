"use client";

import { useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
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
import { notifyPushMatch } from "@/lib/push/actions";
import type { DiscoveryCard } from "@/components/discovery/DiscoveryScreen";
import { AnalyticsEvent } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import {
  formatRediscoveryLabel,
  type RediscoveryBadge,
} from "@/lib/matching/rediscovery";
import { buildSkillOverlapSignal } from "@/lib/matching/skill-overlap";
import { OpenTalentCvButton } from "@/components/profile/OpenTalentCvButton";
import { buildPoolInsight } from "@/lib/matching/pool-insight";
import { CandidateComparisonPanel } from "@/components/matching/CandidateComparisonPanel";

const TOP_N = 5;
const MAX_COMPARE = 2;

function ResultCard({
  card,
  roleId,
  requiredSkills,
  viewerId,
  initialFeedback,
  rediscovery,
  onPass,
  compareChecked,
  onToggleCompare,
}: {
  card: DiscoveryCard;
  roleId: string;
  requiredSkills: string[];
  viewerId: string;
  initialFeedback: MatchFeedbackAction | null;
  rediscovery: RediscoveryBadge | null;
  onPass: (userId: string) => void;
  compareChecked: boolean;
  onToggleCompare: (userId: string) => void;
}) {
  const toast = useToast();
  const [supabase] = useState(() => createClient());
  const [feedback, setFeedback] = useState(initialFeedback);
  const [busy, setBusy] = useState(false);
  const skillOverlap = buildSkillOverlapSignal(
    card.skills ?? [],
    requiredSkills,
  );

  async function interested() {
    if (feedback === "interested") return;
    setBusy(true);
    try {
      await saveProfile(supabase, viewerId, card.userId);
      await recordMatchFeedback(supabase, viewerId, card.userId, "interested");
      setFeedback("interested");
      toast("Marked interested.");
      void notifyPushMatch(card.userId);
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
          {rediscovery ? (
            <p className="mt-1 text-[11px] font-semibold text-mingle-cta">
              {formatRediscoveryLabel(rediscovery)}
            </p>
          ) : null}
        </div>
        <label className="ml-auto flex shrink-0 items-center gap-1.5 self-start text-[11px] font-medium text-mingle-text-secondary">
          <input
            type="checkbox"
            checked={compareChecked}
            onChange={() => onToggleCompare(card.userId)}
            className="h-3.5 w-3.5 rounded border-mingle-border accent-mingle-cta"
          />
          Compare
        </label>
      </div>
      <MatchReportBody report={card.report} compact />
      {skillOverlap ? (
        <p className="text-[11px] leading-snug text-mingle-text">
          <span className="font-semibold">Skill overlap vs role:</span>{" "}
          <span className="text-mingle-text-secondary">
            {skillOverlap.finding}
          </span>
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/profile/view/${card.userId}`}
          onClick={() =>
            track(AnalyticsEvent.matchViewed, {
              role_id: roleId,
              target_user_id: card.userId,
            })
          }
          className="rounded-full bg-mingle-cta px-4 py-2 font-display text-xs font-semibold text-white"
        >
          View profile
        </Link>
        {card.cvPath ? (
          <OpenTalentCvButton
            cvPath={card.cvPath}
            cvFileName={card.cvFileName}
            label={card.cvFileName?.trim() ? card.cvFileName.trim() : "Open CV"}
            className="inline-flex max-w-[11rem] items-center justify-center truncate rounded-full border border-mingle-border bg-mingle-white px-4 py-2 font-display text-xs font-semibold text-mingle-text transition-colors hover:bg-mingle-lavender disabled:opacity-60"
          />
        ) : (
          <span className="rounded-full border border-dashed border-mingle-border px-4 py-2 font-display text-xs font-semibold text-mingle-text-secondary">
            No CV
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2">
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
  requiredSkills = [],
  cards,
  viewerId,
  feedbackByUser,
  rediscoveryByUser = {},
  filters,
}: {
  roleId: string;
  roleTitle: string;
  requiredSkills?: string[];
  cards: DiscoveryCard[];
  viewerId: string;
  feedbackByUser: Record<string, MatchFeedbackAction>;
  rediscoveryByUser?: Record<string, RediscoveryBadge>;
  filters: React.ReactNode;
}) {
  const router = useRouter();
  const toast = useToast();
  const [supabase] = useState(() => createClient());
  const [hidden, setHidden] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const visible = cards.filter((card) => !hidden.includes(card.userId));
  const listed = showAll ? visible : visible.slice(0, TOP_N);
  const poolInsight = buildPoolInsight(cards);
  const compareCards = compareIds
    .map((id) => cards.find((card) => card.userId === id))
    .filter((card): card is DiscoveryCard => card != null);

  async function persistPass(userId: string) {
    try {
      await passProfile(supabase, viewerId, userId);
    } catch {
      toast("Couldn't save that skip.", "error");
    }
    setHidden((prev) => [...prev, userId]);
    router.refresh();
  }

  function toggleCompare(userId: string) {
    setCompareIds((prev) => {
      if (prev.includes(userId)) return prev.filter((id) => id !== userId);
      if (prev.length >= MAX_COMPARE) {
        toast(`You can compare up to ${MAX_COMPARE} candidates at a time.`);
        return prev;
      }
      return [...prev, userId];
    });
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
          {visible.length === 0
            ? "No strong matches in this view yet."
            : visible.length <= TOP_N
              ? `${visible.length} strong match${visible.length === 1 ? "" : "es"}.`
              : `${visible.length} strong matches. Top ${TOP_N} shown first.`}
        </p>
        <p className="mt-1 text-xs font-semibold text-mingle-text-secondary">
          Sort: Best Match
        </p>
      </div>
      {poolInsight ? (
        <div className="mingle-banner rounded-2xl border border-mingle-border p-5">
          <p className="font-display text-[11px] font-semibold uppercase tracking-[0.1em] text-mingle-text-secondary">
            Pool insight
          </p>
          <p className="mt-2 text-sm text-mingle-text">{poolInsight.message}</p>
        </div>
      ) : null}
      {filters}
      {compareCards.length === 2 ? (
        <CandidateComparisonPanel
          a={{ name: compareCards[0].name, report: compareCards[0].report }}
          b={{ name: compareCards[1].name, report: compareCards[1].report }}
          onClear={() => setCompareIds([])}
        />
      ) : null}
      {listed.length === 0 ? (
        <EmptyState
          title="No matches to rank yet"
          body="Invite talent onto mingle, or review people you already passed."
          actionHref="/discover"
          actionLabel="Open Discover"
        />
      ) : (
        <div className="flex flex-col gap-4">
          {listed.map((card) => (
            <ResultCard
              key={card.userId}
              card={card}
              roleId={roleId}
              requiredSkills={requiredSkills}
              viewerId={viewerId}
              initialFeedback={feedbackByUser[card.userId] ?? null}
              rediscovery={rediscoveryByUser[card.userId] ?? null}
              onPass={persistPass}
              compareChecked={compareIds.includes(card.userId)}
              onToggleCompare={toggleCompare}
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
