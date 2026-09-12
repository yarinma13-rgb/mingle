"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  type PanInfo,
} from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { saveProfile } from "@/lib/matching/saved";
import { passProfile, unpassProfile } from "@/lib/matching/passed";
import {
  recordMatchFeedback,
  type MatchFeedbackAction,
  type NotFitReason,
} from "@/lib/matching/feedback";
import { notifyPushMatch } from "@/lib/push/actions";
import type { MatchReport } from "@/lib/matching/report";
import {
  MatchFeedbackActions,
  MatchReportBody,
} from "@/components/matching/MatchReport";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import type { MatchFactor } from "@/lib/matching/engine";
import { EmptyState } from "@/components/EmptyState";
import { MingleChip } from "@/components/MingleChip";
import { useToast } from "@/components/toast/ToastProvider";
import { TalentPhotoImg } from "@/components/profile/TalentPhotoImg";
import { avatarToneClass, type Gender } from "@/lib/profile/avatar";

export type DiscoveryCard = {
  userId: string;
  name: string;
  subtitle: string;
  meta: string;
  initial: string;
  photo: string | null;
  gender: Gender | null;
  score: number;
  factors: MatchFactor[];
  report: MatchReport;
};

const SWIPE_DISTANCE_THRESHOLD = 110;
const SWIPE_VELOCITY_THRESHOLD = 500;

function DiscoveryCardView({
  card,
  initialFeedback,
  viewerId,
  swipeEnabled,
  onPass,
  onHide,
}: {
  card: DiscoveryCard;
  initialFeedback: MatchFeedbackAction | null;
  viewerId: string;
  swipeEnabled: boolean;
  onPass: (userId: string) => void;
  onHide: (userId: string) => void;
}) {
  const toast = useToast();
  const isMobile = useIsMobile();
  const [supabase] = useState(() => createClient());
  const [feedback, setFeedback] = useState<MatchFeedbackAction | null>(
    initialFeedback,
  );
  const [saving, setSaving] = useState(false);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-10, 10]);
  const interestOpacity = useTransform(x, [20, 120], [0, 1]);
  const skipOpacity = useTransform(x, [-120, -20], [1, 0]);

  const expressInterest = async () => {
    if (feedback === "interested") return;
    setSaving(true);
    try {
      await saveProfile(supabase, viewerId, card.userId);
      await recordMatchFeedback(supabase, viewerId, card.userId, "interested");
      setFeedback("interested");
      toast("Marked interested.");
      void notifyPushMatch(card.userId);
    } catch {
      toast("Couldn't save that. Try again in a moment.", "error");
    } finally {
      setSaving(false);
    }
  };

  const markNotFit = async (reason: NotFitReason) => {
    setSaving(true);
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
      setSaving(false);
    }
  };

  const flyOff = (direction: 1 | -1, after: () => void) => {
    animate(x, direction * 600, { duration: 0.28, ease: "easeIn" }).then(after);
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
      flyOff(1, () => onHide(card.userId));
    } else if (passedLeft) {
      flyOff(-1, () => onPass(card.userId));
    } else {
      animate(x, 0, { type: "spring", stiffness: 420, damping: 32 });
    }
  };

  return (
    <motion.div
      style={{ x, rotate, aspectRatio: "3 / 4" }}
      drag={isMobile && swipeEnabled ? "x" : false}
      dragDirectionLock
      dragMomentum={false}
      dragElastic={0.18}
      onDragEnd={isMobile && swipeEnabled ? handleDragEnd : undefined}
      whileDrag={{ cursor: "grabbing" }}
      className={`relative mx-auto flex w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-mingle-border bg-mingle-white shadow-mingle transition-shadow hover:shadow-[0_16px_40px_rgba(45,27,78,0.1)] ${
        isMobile ? "touch-none cursor-grab" : "touch-pan-y"
      }`}
    >
      {isMobile && swipeEnabled && (
        <>
          <motion.span
            aria-hidden
            style={{ opacity: interestOpacity }}
            className="pointer-events-none absolute right-4 top-4 z-20 -rotate-6 rounded-full bg-gradient-to-r from-mingle-pink via-mingle-purple to-mingle-blue px-3 py-1 text-xs font-bold text-white"
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

      <div className="relative min-h-0 flex-[1.15]">
        <div className="absolute inset-0">
          <TalentPhotoImg
            photo={card.photo}
            className="h-full w-full"
            sizes="(max-width: 640px) 100vw, 420px"
            fallback={
              <div
                className={`flex h-full w-full items-center justify-center ${avatarToneClass(card.gender)}`}
              >
                <span className="font-display text-5xl font-bold text-white">
                  {card.initial}
                </span>
              </div>
            }
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent px-5 pb-4 pt-16 text-white">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-display text-xl font-semibold">
                {card.name}
              </p>
              <p className="truncate text-sm text-white/85">{card.subtitle}</p>
              {card.meta ? (
                <p className="truncate text-xs text-white/75">{card.meta}</p>
              ) : null}
            </div>
            <MingleChip tone="pink" className="shrink-0 shadow-sm">
              {card.score} {card.report.strength}
            </MingleChip>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
        <MatchReportBody report={card.report} compact />
      </div>

      {isMobile && swipeEnabled && (
        <p className="px-4 text-center text-[11px] text-mingle-text-secondary">
          Swipe right for interested, left to skip, or use the buttons below.
        </p>
      )}

      <div className="flex flex-col gap-2 p-4 pt-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/profile/view/${card.userId}`}
            className="rounded-full bg-mingle-cta px-4 py-2 font-display text-xs font-semibold text-white"
          >
            View profile
          </Link>
          <button
            type="button"
            onClick={() => onPass(card.userId)}
            className="ml-auto rounded-full px-4 py-2 font-display text-xs font-semibold text-mingle-text-secondary hover:text-mingle-text"
          >
            Skip
          </button>
        </div>
        <MatchFeedbackActions
          audience={card.report.audience}
          action={feedback}
          busy={saving}
          onInterested={() => void expressInterest()}
          onNotFit={(reason) => void markNotFit(reason)}
        />
      </div>
    </motion.div>
  );
}

export function DiscoveryScreen({
  title,
  subtitle,
  cards: initialCards,
  feedbackByUser = {},
  viewerId,
  mode = "feed",
  emptyBody,
}: {
  title: string;
  subtitle: string;
  cards: DiscoveryCard[];
  savedUserIds: string[];
  feedbackByUser?: Record<string, MatchFeedbackAction>;
  viewerId: string;
  mode?: "feed" | "passed";
  emptyBody?: string;
}) {
  const toast = useToast();
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [cards, setCards] = useState(initialCards);
  const isPassed = mode === "passed";

  const hideCard = (userId: string) => {
    setCards((prev) => prev.filter((card) => card.userId !== userId));
  };

  const persistPass = async (userId: string) => {
    try {
      await passProfile(supabase, viewerId, userId);
    } catch {
      toast("Couldn't save that skip.", "error");
    }
    hideCard(userId);
    router.refresh();
  };

  const restore = async (userId: string) => {
    try {
      await unpassProfile(supabase, viewerId, userId);
      hideCard(userId);
      router.refresh();
      toast("Back in Discover. You can view them again there.");
    } catch {
      toast("Couldn't restore that profile.", "error");
    }
  };

  if (cards.length === 0) {
    return (
      <div className="rounded-2xl border border-mingle-border bg-mingle-surface">
        <EmptyState
          title={title}
          body={
            emptyBody ??
            (initialCards.length === 0
              ? isPassed
                ? "Nobody passed yet. Skipped profiles will show up here."
                : "Nobody to discover yet. Check back once more people join mingle."
              : "That is everyone for now. Check back later for more.")
          }
          actionHref={isPassed ? "/discover" : "/dashboard"}
          actionLabel={isPassed ? "Back to Discover" : "Back to dashboard"}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-lg font-semibold text-mingle-text">
          {title}
        </h2>
        <p className="mt-1 text-sm text-mingle-text-secondary">{subtitle}</p>
      </div>

      {isPassed ? (
        <div className="flex flex-col gap-3">
          {cards.map((card) => (
            <div
              key={card.userId}
              className="flex min-w-0 flex-wrap items-center gap-3 rounded-2xl border border-mingle-border bg-mingle-surface p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-semibold text-mingle-text">
                  {card.name}
                </p>
                <p className="truncate text-xs text-mingle-text-secondary">
                  {card.subtitle}
                </p>
              </div>
              <MingleChip className="shrink-0 text-[11px]">
                {card.score} {card.report.strength}
              </MingleChip>
              <Link
                href={`/profile/view/${card.userId}`}
                className="rounded-full bg-mingle-cta px-4 py-2 font-display text-xs font-semibold text-white"
              >
                View profile
              </Link>
              <button
                type="button"
                onClick={() => void restore(card.userId)}
                className="rounded-full bg-mingle-lavender px-4 py-2 font-display text-xs font-semibold text-mingle-text"
              >
                View again
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <DiscoveryCardView
              key={card.userId}
              card={card}
              initialFeedback={feedbackByUser[card.userId] ?? null}
              viewerId={viewerId}
              swipeEnabled
              onPass={persistPass}
              onHide={hideCard}
            />
          ))}
        </div>
      )}
    </div>
  );
}
