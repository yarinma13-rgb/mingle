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
import { scoreChipClass } from "@/lib/matching/score-tone";
import { MatchScoreRing } from "@/components/matching/MatchScoreRing";
import {
  CandidateProfileCvActions,
  OpenTalentCvButton,
} from "@/components/profile/OpenTalentCvButton";
import { Avatar } from "@/components/Avatar";

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
  const [roleDetailsOpen, setRoleDetailsOpen] = useState(false);

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
      className={`relative mx-auto flex w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-mingle-border bg-mingle-white shadow-mingle transition-shadow hover:shadow-[0_16px_40px_rgba(45,27,78,0.12)] ${
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
            className="pointer-events-none absolute right-4 top-4 z-30 -rotate-6 rounded-full bg-mingle-purple px-3 py-1 text-xs font-bold text-white shadow-sm"
          >
            Interested
          </motion.span>
          <motion.span
            aria-hidden
            style={{ opacity: skipOpacity }}
            className="pointer-events-none absolute left-4 top-4 z-30 rotate-6 rounded-full bg-mingle-pink px-3 py-1 text-xs font-bold text-white shadow-sm"
          >
            Skip
          </motion.span>
        </>
      )}

      {isCompanyCard ? (
        <div className="relative aspect-[3/4] max-h-[min(62vh,520px)] w-full shrink-0 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(160deg,#1e3a5f_0%,#3d4f7a_42%,#6b7db3_100%)]">
            <div
              className="absolute inset-0 opacity-35"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35), transparent 42%), radial-gradient(circle at 80% 30%, rgba(167,139,250,0.45), transparent 40%), linear-gradient(180deg, transparent 30%, rgba(15,23,42,0.55) 100%)",
              }}
            />
            {card.photo ? (
              <div className="absolute inset-0 flex items-center justify-center p-10 pb-36 sm:p-14 sm:pb-40">
                <div className="flex aspect-square w-full max-w-[220px] items-center justify-center overflow-hidden rounded-[28px] bg-[#0B0B0F] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.35)] ring-1 ring-white/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={card.photo}
                    alt=""
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center pb-24">
                <div className="flex h-36 w-36 items-center justify-center rounded-[28px] bg-white/15 ring-1 ring-white/25 backdrop-blur-sm sm:h-44 sm:w-44">
                  <span className="font-display text-5xl font-bold text-white sm:text-6xl">
                    {card.initial}
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

          <div className="absolute left-4 top-4 z-10">
            <span className="inline-flex items-center gap-1 rounded-full bg-black/75 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
              <span aria-hidden>🔥</span>
              {card.score}% · {card.report.strength}
            </span>
          </div>

          <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-2.5 px-5 pb-5 pt-16 text-white">
            <div>
              <p className="font-display text-[1.65rem] font-bold leading-tight tracking-tight">
                {card.name}
              </p>
              <p className="mt-0.5 text-base font-medium text-white/90">
                {card.roleTitle || card.subtitle}
              </p>
            </div>

            <div className="flex flex-col gap-1 text-[13px] text-white/85">
              {card.locationLabel ? (
                <p className="flex items-center gap-1.5">
                  <span aria-hidden className="opacity-80">
                    📍
                  </span>
                  {card.locationLabel}
                </p>
              ) : null}
            </div>

            {(card.tags?.length ?? 0) > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {card.tags!.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

            {card.about ? (
              <div className="mt-0.5 flex flex-col gap-2">
                <button
                  type="button"
                  className="w-full rounded-xl bg-white/10 px-3 py-2.5 text-left backdrop-blur-sm transition-colors hover:bg-white/15 active:bg-white/20"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    setRoleDetailsOpen(true);
                    track(AnalyticsEvent.matchViewed, {
                      target_user_id: card.userId,
                      source: "discover_role_about",
                    });
                  }}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/70">
                    About the role
                  </p>
                  <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-white/90">
                    {card.about}
                  </p>
                  <p className="mt-1.5 text-[11px] font-semibold text-white underline decoration-white/50 underline-offset-2">
                    Tap to read full description
                  </p>
                </button>
                <div
                  className="flex flex-wrap items-center gap-2"
                  onPointerDown={(event) => event.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setRoleDetailsOpen(true);
                      track(AnalyticsEvent.matchViewed, {
                        target_user_id: card.userId,
                        source: "discover_role_details",
                      });
                    }}
                    className="rounded-full bg-mingle-cta px-4 py-2 font-display text-xs font-semibold text-white shadow-sm"
                  >
                    View role details
                  </button>
                  <Link
                    href={`/profile/view/${card.userId}`}
                    onClick={() =>
                      track(AnalyticsEvent.matchViewed, {
                        target_user_id: card.userId,
                        source: "discover_company_profile",
                      })
                    }
                    className="rounded-full border border-white/55 bg-white/15 px-4 py-2 font-display text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25"
                  >
                    View company
                  </Link>
                </div>
              </div>
            ) : (
              <div
                className="mt-1 flex flex-wrap items-center gap-2"
                onPointerDown={(event) => event.stopPropagation()}
              >
                <Link
                  href={`/profile/view/${card.userId}`}
                  onClick={() =>
                    track(AnalyticsEvent.matchViewed, {
                      target_user_id: card.userId,
                      source: "discover_company_profile",
                    })
                  }
                  className="rounded-full bg-mingle-cta px-4 py-2 font-display text-xs font-semibold text-white shadow-sm"
                >
                  View company
                </Link>
              </div>
            )}
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
                <p className="truncate font-display text-2xl font-semibold tracking-tight">
                  {card.name}
                </p>
                <p className="truncate text-sm text-white/90">{card.subtitle}</p>
                {card.meta ? (
                  <p className="truncate text-xs text-white/75">{card.meta}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <MatchScoreRing score={card.score} size={76} />
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold shadow-sm backdrop-blur ${scoreChipClass(card.score)}`}
                >
                  {card.report.strength}
                </span>
              </div>
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

            <div className="shrink-0 border-b border-mingle-border px-4 py-3 lg:hidden">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mingle-success">
          Why this is a potential match
        </p>
        <p className="mt-1 line-clamp-2 text-sm leading-snug text-mingle-text">
          {card.report.why[0]?.finding ?? card.report.whatMattersMost}
        </p>
      </div>

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

      <AnimatePresence>
        {roleDetailsOpen && card.about ? (
          <motion.div
            key="role-details"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex items-end bg-black/55 p-3 sm:items-center sm:justify-center"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => setRoleDetailsOpen(false)}
            role="presentation"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Role details"
              initial={{ y: 24, opacity: 0.96 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 16, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="max-h-[80%] w-full max-w-sm overflow-y-auto rounded-2xl bg-mingle-white p-5 shadow-mingle"
              onClick={(event) => event.stopPropagation()}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mingle-text-secondary">
                About the role
              </p>
              <h3 className="mt-1 font-display text-lg font-semibold tracking-tight text-mingle-text">
                {card.roleTitle || card.subtitle || "Role"}
              </h3>
              <p className="mt-0.5 text-sm text-mingle-text-secondary">
                {card.name}
              </p>
              {card.locationLabel ? (
                <p className="mt-2 text-xs text-mingle-text-secondary">
                  {card.locationLabel}
                </p>
              ) : null}
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-mingle-text">
                {card.about}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href={`/profile/view/${card.userId}`}
                  className="mingle-btn-primary rounded-full px-4 py-2 text-sm"
                  onClick={() => setRoleDetailsOpen(false)}
                >
                  View company
                </Link>
                <button
                  type="button"
                  className="mingle-btn-secondary rounded-full px-4 py-2 text-sm"
                  onClick={() => setRoleDetailsOpen(false)}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
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
  profileHref,
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
  profileHref?: string;
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
    const trulyEmpty = !isPassed && initialCards.length === 0 && !emptyBody;
    return (
      <div className="rounded-2xl border border-mingle-border bg-mingle-surface">
        <EmptyState
          variant="discover"
          title={trulyEmpty ? "No matches yet" : title}
          body={
            trulyEmpty
              ? "We're looking for people who fit what you're looking for."
              : (emptyBody ??
                (initialCards.length === 0
                  ? isPassed
                    ? "Nobody passed yet. Skipped profiles will show up here."
                    : "Nobody to discover yet. Check back once more people join mingle."
                  : "That is everyone for now. Check back later for more."))
          }
          actionHref={
            trulyEmpty && profileHref
              ? profileHref
              : isPassed
                ? "/discover"
                : "/dashboard"
          }
          actionLabel={
            trulyEmpty && profileHref
              ? "Adjust preferences"
              : isPassed
                ? "Back to Discover"
                : "Back to dashboard"
          }
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
              <span
                className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${scoreChipClass(card.score)}`}
              >
                {card.score}% · {card.report.strength}
              </span>
              <Link
                href={`/profile/view/${card.userId}`}
                className="rounded-full bg-mingle-cta px-4 py-2 font-display text-xs font-semibold text-white"
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
                <span className="rounded-full border border-dashed border-mingle-border px-4 py-2 font-display text-xs font-semibold text-mingle-text-secondary">
                  No CV
                </span>
              )}
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
      ) : isBrowse ? (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium text-mingle-text-secondary">
            {cards.length} candidate{cards.length === 1 ? "" : "s"} on this page —
            open any profile without advancing one-by-one.
          </p>
          {cards.map((card) => (
            <article
              key={card.userId}
              className="flex min-w-0 flex-wrap items-center gap-3 rounded-2xl border border-mingle-border bg-mingle-surface p-4"
            >
              <Avatar
                photo={card.photo}
                initials={card.initial}
                gender={card.gender}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-semibold text-mingle-text">
                  {card.name}
                </p>
                <p className="truncate text-xs text-mingle-text-secondary">
                  {card.subtitle}
                </p>
                {card.meta ? (
                  <p className="mt-0.5 truncate text-[11px] text-mingle-text-muted">
                    {card.meta}
                  </p>
                ) : null}
              </div>
              <span
                className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${scoreChipClass(card.score)}`}
              >
                {card.score}% · {card.report.strength}
              </span>
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
            <aside className="hidden min-h-[min(720px,85vh)] flex-col rounded-3xl border border-mingle-border bg-mingle-surface-elevated p-5 shadow-mingle transition-shadow duration-200 lg:flex">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mingle-text-secondary">
                Match report
              </p>
              <div className="mt-3 flex items-center gap-3">
                <MatchScoreRing score={cards[0].score} size={88} showLabel />
                <div className="min-w-0">
                  <p className="font-display text-sm font-semibold text-mingle-text">
                    {cards[0].name}
                  </p>
                  <p className="text-xs text-mingle-text-secondary">
                    {cards[0].report.strength}
                  </p>
                </div>
              </div>
              {cards[0].cvPath ? (
                <div className="mt-3">
                  <OpenTalentCvButton
                    cvPath={cards[0].cvPath}
                    cvFileName={cards[0].cvFileName}
                    label={
                      cards[0].cvFileName?.trim()
                        ? cards[0].cvFileName.trim()
                        : "Open CV"
                    }
                    className="w-full rounded-full border border-mingle-border bg-mingle-white px-4 py-2.5 text-center font-display text-xs font-semibold text-mingle-text transition-colors hover:bg-mingle-lavender disabled:opacity-60"
                  />
                </div>
              ) : cards[0].kind !== "company" ? (
                <p className="mt-3 text-xs text-mingle-text-secondary">
                  No CV uploaded for this candidate.
                </p>
              ) : null}
              <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
                <MatchReportBody report={cards[0].report} />
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}
