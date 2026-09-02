"use client";

import { useState } from "react";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  type PanInfo,
} from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { saveProfile, unsaveProfile } from "@/lib/matching/saved";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import type { MatchFactor } from "@/lib/matching/engine";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/components/toast/ToastProvider";

export type DiscoveryCard = {
  userId: string;
  name: string;
  subtitle: string;
  meta: string;
  initial: string;
  score: number;
  factors: MatchFactor[];
};

const SWIPE_DISTANCE_THRESHOLD = 110;
const SWIPE_VELOCITY_THRESHOLD = 500;

function verdictColor(verdict: MatchFactor["verdict"]) {
  switch (verdict) {
    case "aligned":
      return "text-mingle-purple";
    case "partial":
      return "text-mingle-cta";
    case "not-aligned":
      return "text-mingle-pink";
    default:
      return "text-mingle-text-secondary";
  }
}

function verdictLabel(verdict: MatchFactor["verdict"]) {
  switch (verdict) {
    case "aligned":
      return "Aligned";
    case "partial":
      return "Partial";
    case "not-aligned":
      return "Not aligned";
    default:
      return "Not enough data";
  }
}

function scoreGradient(score: number) {
  if (score >= 70) return "from-mingle-purple to-mingle-cta";
  if (score >= 45) return "from-mingle-pink to-mingle-purple";
  return "from-mingle-cta to-mingle-pink";
}

function FactorRow({ factor }: { factor: MatchFactor }) {
  return (
    <div className="flex flex-col gap-0.5 py-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-mingle-white">
          {factor.label}
          <span className="ml-1.5 text-mingle-text-secondary">
            {factor.weight}%
          </span>
        </span>
        <span className={`text-xs font-semibold ${verdictColor(factor.verdict)}`}>
          {verdictLabel(factor.verdict)}
        </span>
      </div>
      <p className="text-xs text-mingle-text-secondary">{factor.detail}</p>
    </div>
  );
}

function DiscoveryCardView({
  card,
  initiallySaved,
  onRemove,
}: {
  card: DiscoveryCard;
  initiallySaved: boolean;
  onRemove: (userId: string) => void;
}) {
  const toast = useToast();
  const isMobile = useIsMobile();
  const [supabase] = useState(() => createClient());
  const [saved, setSaved] = useState(initiallySaved);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Drag-driven position for the mobile swipe gesture. Stays at 0 and
  // inert on desktop, since drag is never enabled there.
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-10, 10]);
  const interestOpacity = useTransform(x, [20, 120], [0, 1]);
  const skipOpacity = useTransform(x, [-120, -20], [1, 0]);

  const aligned = card.factors.filter((f) => f.verdict === "aligned");
  const notAligned = card.factors.filter(
    (f) => f.verdict === "not-aligned" || f.verdict === "partial",
  );
  const unknown = card.factors.filter((f) => f.verdict === "unknown");

  // Swipe right and the Save button both express interest through the
  // exact same persisted action — swipe is just a faster way to reach it.
  const expressInterest = async () => {
    if (saved) return;
    setSaving(true);
    try {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        await saveProfile(supabase, data.user.id, card.userId);
        setSaved(true);
        toast("Saved for later.");
      }
    } catch {
      toast("Couldn't save that. Try again in a moment.", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleSaveFromButton = async () => {
    if (saved) {
      setSaving(true);
      try {
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          await unsaveProfile(supabase, data.user.id, card.userId);
          setSaved(false);
          toast("Removed from saved.");
        }
      } catch {
        toast("Couldn't update that. Try again in a moment.", "error");
      } finally {
        setSaving(false);
      }
      return;
    }
    await expressInterest();
  };

  const flyOffAndRemove = (direction: 1 | -1) => {
    animate(x, direction * 600, { duration: 0.28, ease: "easeIn" }).then(() => {
      onRemove(card.userId);
    });
  };

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const passedRight =
      info.offset.x > SWIPE_DISTANCE_THRESHOLD ||
      info.velocity.x > SWIPE_VELOCITY_THRESHOLD;
    const passedLeft =
      info.offset.x < -SWIPE_DISTANCE_THRESHOLD ||
      info.velocity.x < -SWIPE_VELOCITY_THRESHOLD;

    if (passedRight) {
      expressInterest();
      flyOffAndRemove(1);
    } else if (passedLeft) {
      flyOffAndRemove(-1);
    } else {
      animate(x, 0, { type: "spring", stiffness: 420, damping: 32 });
    }
  };

  return (
    <motion.div
      style={{ x, rotate }}
      drag={isMobile ? "x" : false}
      dragDirectionLock
      dragMomentum={false}
      onDragEnd={isMobile ? handleDragEnd : undefined}
      whileDrag={{ cursor: "grabbing" }}
      className="relative flex touch-pan-y flex-col gap-4 rounded-2xl border border-mingle-border bg-mingle-surface p-6"
    >
      {isMobile && (
        <>
          <motion.span
            aria-hidden
            style={{ opacity: interestOpacity }}
            className="pointer-events-none absolute right-4 top-4 -rotate-6 rounded-full bg-gradient-to-r from-mingle-pink to-mingle-purple px-3 py-1 text-xs font-bold text-white"
          >
            Interested
          </motion.span>
          <motion.span
            aria-hidden
            style={{ opacity: skipOpacity }}
            className="pointer-events-none absolute left-4 top-4 rotate-6 rounded-full border border-mingle-border bg-mingle-bg px-3 py-1 text-xs font-bold text-mingle-text-secondary"
          >
            Skip
          </motion.span>
        </>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-mingle-pink to-mingle-purple font-display text-sm font-bold text-white">
            {card.initial}
          </div>
          <div>
            <p className="font-display text-base font-semibold text-mingle-white">
              {card.name}
            </p>
            <p className="text-sm text-mingle-text-secondary">
              {card.subtitle}
            </p>
            {card.meta && (
              <p className="text-xs text-mingle-text-secondary">{card.meta}</p>
            )}
          </div>
        </div>

        <div
          className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br text-white ${scoreGradient(card.score)}`}
        >
          <span className="font-display text-base font-bold leading-none">
            {card.score}%
          </span>
          <span className="mt-0.5 text-[9px] uppercase tracking-wide opacity-80">
            match
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-mingle-purple">
            Why this could be a match
          </h3>
          {aligned.length > 0 ? (
            <div className="divide-y divide-mingle-border">
              {aligned.map((factor) => (
                <FactorRow key={factor.key} factor={factor} />
              ))}
            </div>
          ) : (
            <p className="mt-1.5 text-xs text-mingle-text-secondary">
              Nothing strongly aligned yet.
            </p>
          )}
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-mingle-pink">
            What doesn&rsquo;t align yet
          </h3>
          {notAligned.length > 0 ? (
            <div className="divide-y divide-mingle-border">
              {notAligned.map((factor) => (
                <FactorRow key={factor.key} factor={factor} />
              ))}
            </div>
          ) : (
            <p className="mt-1.5 text-xs text-mingle-text-secondary">
              Nothing stands out as misaligned.
            </p>
          )}
        </div>
      </div>

      {unknown.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="text-xs font-medium text-mingle-text-secondary underline decoration-dotted"
          >
            {expanded ? "Hide" : "Show"} {unknown.length} factor
            {unknown.length > 1 ? "s" : ""} without enough data yet
          </button>
          {expanded && (
            <div className="mt-1 divide-y divide-mingle-border">
              {unknown.map((factor) => (
                <FactorRow key={factor.key} factor={factor} />
              ))}
            </div>
          )}
        </div>
      )}

      {isMobile && (
        <p className="text-center text-[11px] text-mingle-text-secondary">
          Swipe right for interested, left to skip — or use the buttons below.
        </p>
      )}

      <div className="flex items-center gap-3">
        <Link
          href={`/profile/view/${card.userId}`}
          className="rounded-full bg-mingle-cta px-6 py-2.5 font-display text-xs font-semibold text-mingle-white"
        >
          View profile
        </Link>
        <button
          type="button"
          onClick={toggleSaveFromButton}
          disabled={saving}
          className={`rounded-full px-6 py-2.5 font-display text-xs font-semibold transition-colors disabled:opacity-60 ${
            saved
              ? "bg-mingle-purple/15 text-mingle-purple"
              : "bg-mingle-bg text-mingle-white hover:bg-mingle-bg/70"
          }`}
        >
          {saved ? "Saved" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => onRemove(card.userId)}
          className="ml-auto rounded-full px-6 py-2.5 font-display text-xs font-semibold text-mingle-text-secondary hover:text-mingle-white"
        >
          Skip
        </button>
      </div>
    </motion.div>
  );
}

export function DiscoveryScreen({
  title,
  subtitle,
  cards: initialCards,
  savedUserIds,
  emptyBody,
}: {
  title: string;
  subtitle: string;
  cards: DiscoveryCard[];
  savedUserIds: string[];
  emptyBody?: string;
}) {
  const [cards, setCards] = useState(initialCards);
  const savedSet = new Set(savedUserIds);

  const removeCard = (userId: string) => {
    setCards((prev) => prev.filter((card) => card.userId !== userId));
  };

  if (cards.length === 0) {
    return (
      <div className="rounded-2xl border border-mingle-border bg-mingle-surface">
        <EmptyState
          title={title}
          body={
            emptyBody ??
            (initialCards.length === 0
              ? "Nobody to discover yet. Check back once more people join mingle."
              : "That is everyone for now. Check back later for more.")
          }
          actionHref="/dashboard"
          actionLabel="Back to dashboard"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-lg font-semibold text-mingle-white">
          {title}
        </h2>
        <p className="mt-1 text-sm text-mingle-text-secondary">{subtitle}</p>
      </div>

      <div className="flex flex-col gap-4">
        {cards.map((card) => (
          <DiscoveryCardView
            key={card.userId}
            card={card}
            initiallySaved={savedSet.has(card.userId)}
            onRemove={removeCard}
          />
        ))}
      </div>
    </div>
  );
}
