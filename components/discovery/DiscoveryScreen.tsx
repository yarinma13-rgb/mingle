"use client";

import { AnalyticsEvent } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  motion,
  AnimatePresence,
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
} from "@/lib/matching/feedback";
import { notifyPushMatch } from "@/lib/push/actions";
import type { MatchReport } from "@/lib/matching/report";
import {
  MatchReportBody,
} from "@/components/matching/MatchReport";
import { DiscoverSwipeActions } from "@/components/discovery/DiscoverSwipeActions";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import type { MatchFactor } from "@/lib/matching/engine";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/components/toast/ToastProvider";
import { TalentPhotoImg } from "@/components/profile/TalentPhotoImg";
import { avatarToneClass, type Gender } from "@/lib/profile/avatar";
import { MatchScoreRing } from "@/components/matching/MatchScoreRing";
import { WhyItWorks } from "@/components/matching/WhyItWorks";
import {
  CandidateProfileCvActions,
  OpenTalentCvButton,
} from "@/components/profile/OpenTalentCvButton";
import { Avatar } from "@/components/Avatar";
import { MingleChip } from "@/components/MingleChip";

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
  /** Talent skills when available (role matches soft overlap). */
  skills?: string[];
  /**
   * Talent Discover shows company/role cards (job-poster style).
   * Company Discover keeps person cards.
   */
  kind?: "person" | "company";
  roleTitle?: string | null;
  locationLabel?: string | null;
  salaryLabel?: string | null;
  tags?: string[];
  about?: string | null;
  /** Present when talent uploaded a CV PDF (company viewers). */
  cvPath?: string | null;
  cvFileName?: string | null;
};

const SWIPE_DISTANCE_THRESHOLD = 110;
const SWIPE_VELOCITY_THRESHOLD = 500;

function DiscoverySkeletonCard({ label }: { label: string }) {
  return (
    <div
      aria-hidden
      className="mx-auto flex w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-dashed border-mingle-border bg-mingle-lavender/60"
    >
      <div className="aspect-[3/4] max-h-[min(40vh,280px)] w-full animate-pulse bg-mingle-border/40" />
      <div className="flex flex-col items-center gap-2 px-5 py-6 text-center">
        <div className="h-3 w-28 animate-pulse rounded-full bg-mingle-border/50" />
        <p className="text-xs font-medium text-mingle-text-secondary">{label}</p>
      </div>
    </div>
  );
}

function DiscoveryCardView({
  card,
  initialFeedback,
  viewerId,
  swipeEnabled,
  messageHref,
  onPass,
  onHide,
}: {
  card: DiscoveryCard;
  initialFeedback: MatchFeedbackAction | null;
  viewerId: string;
  swipeEnabled: boolean;
  messageHref?: string | null;
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

  useEffect(() => {
    track(AnalyticsEvent.matchCardViewed, {
      target_user_id: card.userId,
      score: card.score,
      card_kind: card.kind,
    });
  }, [card.userId, card.score, card.kind]);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-10, 10]);
  const interestOpacity = useTransform(x, [20, 120], [0, 1]);
  // Opacity rises as the card moves left (negative x) — not at rest.
  const skipOpacity = useTransform(x, [0, -20, -120], [0, 0.35, 1]);
  const isCompanyCard = card.kind === "company";

  const advanceAfterInterest = () => {
    flyOff(1, () => onHide(card.userId));
  };

  const expressInterest = async (opts?: { advance?: boolean }) => {
    const shouldAdvance = opts?.advance !== false;
    if (feedback === "interested") {
      if (shouldAdvance) advanceAfterInterest();
      return;
    }
    // Optimistic: advance immediately so the deck never feels stuck.
    setFeedback("interested");
    if (shouldAdvance) advanceAfterInterest();
    setSaving(true);
    try {
      await Promise.all([
        saveProfile(supabase, viewerId, card.userId),
        recordMatchFeedback(supabase, viewerId, card.userId, "interested"),
      ]);
      track(AnalyticsEvent.matchInterested, {
        target_user_id: card.userId,
        source: "discover",
      });
      track(AnalyticsEvent.profileSaved, {
        target_user_id: card.userId,
        saved: true,
      });
      toast("Marked interested.");
      void notifyPushMatch(card.userId);
    } catch {
      toast("Couldn't save that. Try again in a moment.", "error");
    } finally {
      setSaving(false);
    }
  };

  const saveForLater = async () => {
    setSaving(true);
    try {
      await saveProfile(supabase, viewerId, card.userId);
      track(AnalyticsEvent.profileSaved, {
        target_user_id: card.userId,
        saved: true,
      });
      toast("Saved for later.");
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
      void expressInterest({ advance: true });
    } else if (passedLeft) {
      flyOff(-1, () => onPass(card.userId));
    } else {
      animate(x, 0, { type: "spring", stiffness: 420, damping: 32 });
    }
  };

  return (
    <motion.div
      style={{ x, rotate }}
      drag={isMobile && swipeEnabled ? "x" : false}
      dragDirectionLock
      dragMomentum={false}
      dragElastic={0.18}
      onDragEnd={isMobile && swipeEnabled ? handleDragEnd : undefined}
      whileDrag={{ cursor: "grabbing" }}
      className={`relative mx-auto flex w-full max-w-sm flex-col overflow-hidden rounded-[20px] border border-mingle-border bg-mingle-white shadow-mingle mingle-card-interactive ${
        isMobile
          ? "touch-none cursor-grab"
          : "touch-pan-y"
      }`}
    >
      {isMobile && swipeEnabled && (
        <>
          <motion.span
            aria-hidden
            style={{ opacity: interestOpacity }}
            className="pointer-events-none absolute right-4 top-4 z-30 -rotate-6 rounded-[10px] bg-[#7B2FF7] px-3 py-1 text-xs font-bold text-white shadow-sm"
          >
            Interested
          </motion.span>
          <motion.span
            aria-hidden
            style={{ opacity: skipOpacity }}
            className="pointer-events-none absolute left-4 top-4 z-30 rotate-6 rounded-[10px] bg-[#EA1E63] px-3 py-1 text-xs font-bold text-white shadow-sm"
          >
            Skip
          </motion.span>
        </>
      )}

      {isCompanyCard ? (
        <div className="relative flex min-h-[min(52vh,440px)] w-full shrink-0 flex-col bg-gradient-to-b from-[color:var(--mingle-light-blue)]/50 via-mingle-white to-mingle-white px-5 pb-5 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="mingle-logo-tile !h-[52px] !w-[52px]">
                {card.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={card.photo} alt="" />
                ) : (
                  <span className="font-display text-lg font-bold text-mingle-text">
                    {card.initial}
                  </span>
                )}
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="truncate font-display text-xl font-bold tracking-tight text-mingle-text">
                  {card.name}
                </p>
                <p className="mt-0.5 truncate text-sm text-mingle-text-secondary">
                  {card.subtitle || "Company"}
                </p>
              </div>
            </div>
            <MatchScoreRing score={card.score} size={72} showLabel />
          </div>

          <div className="mt-5 flex flex-col gap-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-mingle-text-secondary">
              Open role
            </p>
            <p className="font-display text-lg font-semibold text-mingle-text">
              {card.roleTitle || card.subtitle}
            </p>
            {card.locationLabel ? (
              <p className="text-[13px] text-mingle-text-secondary">
                {card.locationLabel}
              </p>
            ) : null}
          </div>

          {(card.tags?.length ?? 0) > 0 ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {card.tags!.slice(0, 4).map((tag) => (
                <MingleChip key={tag} tone="blue">
                  {tag}
                </MingleChip>
              ))}
            </div>
          ) : null}

          {card.about ? (
            <p className="mt-4 line-clamp-3 text-[13px] leading-relaxed text-mingle-text-secondary">
              {card.about}
            </p>
          ) : null}

          <div className="mt-auto pt-5">
            <WhyItWorks
              reasons={(card.report.why ?? []).map(
                (b) => b.label || b.finding,
              )}
              max={3}
            />
          </div>
        </div>
      ) : (
        <div className="relative aspect-[3/4] max-h-[min(58vh,480px)] w-full shrink-0 overflow-hidden">
          <div className="absolute inset-0">
            <TalentPhotoImg
              photo={card.photo}
              className="h-full w-full object-cover"
              sizes="(max-width: 640px) 100vw, 420px"
              fallback={
                <div
                  className={`flex h-full w-full items-center justify-center ${avatarToneClass(card.gender)}`}
                >
                  <span className="font-display text-6xl font-bold text-white sm:text-7xl">
                    {card.initial}
                  </span>
                </div>
              }
            />
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-5 pb-5 pt-24 text-white">
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-display text-2xl font-bold tracking-tight">
                  {card.name}
                </p>
                <p className="truncate text-sm text-white/90">{card.subtitle}</p>
                {card.meta ? (
                  <p className="truncate text-xs text-white/75">{card.meta}</p>
                ) : null}
              </div>
              <MatchScoreRing score={card.score} size={76} />
            </div>
            <div className="mt-3">
              <CandidateProfileCvActions
                userId={card.userId}
                cvPath={card.cvPath}
                cvFileName={card.cvFileName}
                variant="onDark"
                onViewProfile={() =>
                  track(AnalyticsEvent.matchViewed, {
                    target_user_id: card.userId,
                    source: "discover_card",
                  })
                }
              />
            </div>
          </div>
        </div>
      )}

      {!isCompanyCard ? (
        <div className="shrink-0 border-b border-mingle-border px-4 py-3.5 lg:hidden">
          <WhyItWorks
            reasons={(card.report.why ?? []).map((b) => b.label || b.finding)}
            max={3}
          />
        </div>
      ) : null}

      <div className="shrink-0 bg-mingle-white px-4 pb-4 pt-3">
        <DiscoverSwipeActions
          busy={saving}
          interestedDone={feedback === "interested"}
          messageHref={messageHref}
          dragX={isMobile && swipeEnabled ? x : null}
          onSkip={() => onPass(card.userId)}
          onSave={() => void saveForLater()}
          onInterested={() => void expressInterest()}
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
  acceptedConnectionByUser = {},
  viewerId,
  mode = "feed",
  emptyBody,
}: {
  title: string;
  subtitle: string;
  cards: DiscoveryCard[];
  savedUserIds: string[];
  feedbackByUser?: Record<string, MatchFeedbackAction>;
  /** Map of other userId → accepted connection id for Message quick-action. */
  acceptedConnectionByUser?: Record<string, string>;
  viewerId: string;
  mode?: "feed" | "passed" | "browse";
  emptyBody?: string;
}) {
  const toast = useToast();
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [cards, setCards] = useState(initialCards);
  const isPassed = mode === "passed";
  const isBrowse = mode === "browse";

  const hideCard = (userId: string) => {
    setCards((prev) => prev.filter((card) => card.userId !== userId));
  };

  const persistPass = async (userId: string) => {
    try {
      track(AnalyticsEvent.matchSkipped, { target_user_id: userId, source: "discover" });
      await passProfile(supabase, viewerId, userId);
      toast("Skipped.");
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
      <div className="rounded-[20px] border border-mingle-border bg-mingle-surface">
        <EmptyState
          variant="discover"
          title={title}
          body={
            emptyBody ??
            (initialCards.length === 0
              ? isPassed
                ? "Nobody passed yet. Skipped profiles will show up here."
                : "No matches yet. We're looking for people who fit what you're looking for."
              : "That is everyone for now. Check back later for more.")
          }
          actionHref={isPassed ? "/discover" : "/dashboard"}
          actionLabel={isPassed ? "Back to Discover" : "Adjust preferences"}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-[28px] font-bold tracking-tight text-mingle-text">
          {title}
        </h2>
        <p className="mt-1.5 text-[15px] text-mingle-text-secondary">{subtitle}</p>
      </div>

      {isPassed ? (
        <div className="flex flex-col gap-3">
          {cards.map((card) => (
            <div
              key={card.userId}
              className="flex min-w-0 flex-wrap items-center gap-3 rounded-[18px] border border-mingle-border bg-mingle-surface p-4 shadow-mingle"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-base font-semibold text-mingle-text">
                  {card.name}
                </p>
                <p className="truncate text-sm text-mingle-text-secondary">
                  {card.subtitle}
                </p>
              </div>
              <MatchScoreRing score={card.score} size={56} showLabel caption={null} />
              <Link
                href={`/profile/view/${card.userId}`}
                className="mingle-btn-secondary !min-h-10 !px-4 !py-2 text-xs"
              >
                View profile
              </Link>
              {card.cvPath ? (
                <OpenTalentCvButton
                  cvPath={card.cvPath}
                  cvFileName={card.cvFileName}
                  label={card.cvFileName?.trim() || "Open CV"}
                />
              ) : (
                <span className="rounded-[12px] border border-dashed border-mingle-border px-4 py-2 font-display text-xs font-semibold text-mingle-text-secondary">
                  No CV
                </span>
              )}
              <button
                type="button"
                onClick={() => void restore(card.userId)}
                className="mingle-btn-tertiary text-xs"
              >
                View again
              </button>
            </div>
          ))}
        </div>
      ) : isBrowse ? (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium text-mingle-text-secondary">
            {cards.length} candidate{cards.length === 1 ? "" : "s"} on this page —
            open any profile without advancing one-by-one.
          </p>
          {cards.map((card) => (
            <article
              key={card.userId}
              className="flex min-w-0 flex-wrap items-center gap-4 rounded-[18px] border border-mingle-border bg-mingle-surface p-4 shadow-mingle mingle-card-interactive"
            >
              <Avatar
                photo={card.photo}
                initials={card.initial}
                gender={card.gender}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-base font-bold text-mingle-text">
                  {card.name}
                </p>
                <p className="truncate text-sm text-mingle-text-secondary">
                  {card.subtitle}
                </p>
                {card.meta ? (
                  <p className="mt-0.5 truncate text-[12px] text-mingle-text-muted">
                    {card.meta}
                  </p>
                ) : null}
                {(card.report.why?.length ?? 0) > 0 ? (
                  <p className="mt-1.5 line-clamp-1 text-[12px] text-mingle-text-secondary">
                    <span className="font-semibold text-mingle-accent-purple">
                      Why it works:{" "}
                    </span>
                    {card.report.why
                      .slice(0, 2)
                      .map((b) => b.label)
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                ) : null}
              </div>
              <MatchScoreRing score={card.score} size={64} showLabel />
              <CandidateProfileCvActions
                userId={card.userId}
                cvPath={card.cvPath}
                cvFileName={card.cvFileName}
                onViewProfile={() =>
                  track(AnalyticsEvent.matchViewed, {
                    target_user_id: card.userId,
                    source: "discover_browse",
                  })
                }
              />
            </article>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-xs font-medium text-mingle-text-secondary">
            {cards.length === initialCards.length
              ? `${cards.length} to review`
              : `${initialCards.length - cards.length + 1} of ${initialCards.length}`}
          </p>
          <div className="relative mx-auto grid w-full max-w-5xl grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(280px,380px)_minmax(0,1fr)]">
            <AnimatePresence mode="wait">
              <motion.div
                key={cards[0].userId}
                initial={{ opacity: 0, y: 14, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="relative"
              >
                <DiscoveryCardView
                  card={cards[0]}
                  initialFeedback={feedbackByUser[cards[0].userId] ?? null}
                  viewerId={viewerId}
                  swipeEnabled
                  messageHref={
                    acceptedConnectionByUser[cards[0].userId]
                      ? `/conversations/${acceptedConnectionByUser[cards[0].userId]}`
                      : null
                  }
                  onPass={persistPass}
                  onHide={hideCard}
                />
              </motion.div>
            </AnimatePresence>
            {cards.length === 1 ? (
              <div className="pointer-events-none absolute inset-x-0 -bottom-2 -z-10 opacity-70 lg:hidden">
                <DiscoverySkeletonCard label="Still waiting for more matches…" />
              </div>
            ) : null}
            <aside className="hidden min-h-[min(720px,85vh)] flex-col rounded-[22px] border border-mingle-border bg-mingle-surface p-6 shadow-mingle transition-shadow duration-200 lg:flex">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mingle-text-secondary">
                Match report
              </p>
              <div className="mt-4 flex items-start gap-4">
                <MatchScoreRing score={cards[0].score} size={96} showLabel />
                <div className="min-w-0 pt-1">
                  <p className="font-display text-base font-bold text-mingle-text">
                    {cards[0].name}
                  </p>
                  <p className="mt-0.5 text-sm text-mingle-text-secondary">
                    {cards[0].subtitle}
                  </p>
                  <p className="mt-2 text-xs font-medium text-mingle-text-secondary">
                    {cards[0].report.strength}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <WhyItWorks
                  reasons={(cards[0].report.why ?? []).map(
                    (b) => b.label || b.finding,
                  )}
                  max={4}
                />
              </div>
              {cards[0].cvPath ? (
                <div className="mt-4">
                  <OpenTalentCvButton
                    cvPath={cards[0].cvPath}
                    cvFileName={cards[0].cvFileName}
                    label={
                      cards[0].cvFileName?.trim()
                        ? cards[0].cvFileName.trim()
                        : "Open CV"
                    }
                    className="mingle-btn-secondary w-full text-center text-xs"
                  />
                </div>
              ) : cards[0].kind !== "company" ? (
                <p className="mt-4 text-xs text-mingle-text-secondary">
                  No CV uploaded for this candidate.
                </p>
              ) : null}
              <div className="mt-5 min-h-0 flex-1 overflow-y-auto">
                <MatchReportBody report={cards[0].report} />
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}
