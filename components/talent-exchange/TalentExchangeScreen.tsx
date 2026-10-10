"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { expressCompanyInterest } from "@/lib/talent-exchange/persistence";
import type { AnonymousCandidateCard } from "@/lib/talent-exchange/anonymize";
import { Avatar } from "@/components/Avatar";
import { MatchScoreRing } from "@/components/matching/MatchScoreRing";
import { MatchReportBody } from "@/components/matching/MatchReport";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/components/toast/ToastProvider";

function cardHeadline(card: AnonymousCandidateCard): string {
  const parts = [
    card.seniority,
    card.yearsExperience ? `${card.yearsExperience}+ years` : null,
    card.industry,
  ].filter(Boolean);
  return parts.join(" · ") || "Candidate";
}

function CandidateCard({
  card,
  initiallyInterested,
}: {
  card: AnonymousCandidateCard;
  initiallyInterested: boolean;
}) {
  const toast = useToast();
  const [interested, setInterested] = useState(initiallyInterested);
  const [busy, setBusy] = useState(false);

  async function markInterested() {
    if (busy || interested) return;
    setBusy(true);
    try {
      const supabase = createClient();
      await expressCompanyInterest(supabase, card.matchId);
      setInterested(true);
      toast("Marked interested — we'll let you know if they are too.");
    } catch {
      toast("Couldn't save that. Try again in a moment.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-mingle-border bg-mingle-white p-5 shadow-mingle">
      <div className="flex items-start gap-4">
        {card.identity ? (
          <Avatar photo={card.identity.photo} initials={card.identity.name.slice(0, 2)} />
        ) : (
          <MatchScoreRing score={card.report.overall} size={56} showLabel />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-semibold text-mingle-text">
            {card.identity ? card.identity.name : cardHeadline(card)}
          </p>
          <p className="mt-0.5 text-sm text-mingle-text-secondary">
            {[card.location, card.salaryRangeLabel].filter(Boolean).join(" · ")}
          </p>
          {card.skills.length > 0 ? (
            <p className="mt-1 text-xs text-mingle-text-secondary">
              {card.skills.slice(0, 6).join(", ")}
            </p>
          ) : null}
        </div>
        {card.identity ? (
          <MatchScoreRing score={card.report.overall} size={48} />
        ) : null}
      </div>

      <div className="mt-4">
        <MatchReportBody report={card.report} compact />
      </div>

      <button
        type="button"
        disabled={busy || interested}
        onClick={() => void markInterested()}
        className="mingle-btn-primary mt-4 w-full disabled:opacity-60"
      >
        {interested ? "Waiting for response" : "Interested"}
      </button>
    </div>
  );
}

export function TalentExchangeScreen({
  cards,
  alreadyInterestedByMatch,
}: {
  cards: AnonymousCandidateCard[];
  alreadyInterestedByMatch: Record<string, boolean>;
}) {
  if (cards.length === 0) {
    return (
      <EmptyState
        title="No talent exchange matches yet"
        body="When a candidate declined elsewhere opts into discoverability and matches one of your open roles, they'll show up here."
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      {cards.map((card) => (
        <CandidateCard
          key={card.matchId}
          card={card}
          initiallyInterested={Boolean(alreadyInterestedByMatch[card.matchId])}
        />
      ))}
    </div>
  );
}
