"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { saveProfile } from "@/lib/matching/saved";
import {
  recordMatchFeedback,
  type MatchFeedbackAction,
} from "@/lib/matching/feedback";
import { notifyPushMatch } from "@/lib/push/actions";
import { AnalyticsEvent } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { useToast } from "@/components/toast/ToastProvider";
import { Avatar } from "@/components/Avatar";
import { MatchScoreRing } from "@/components/matching/MatchScoreRing";
import {
  FitBars,
  MatchReportBody,
} from "@/components/matching/MatchReport";
import { DiscoverSwipeActions } from "@/components/discovery/DiscoverSwipeActions";
import { OpenTalentCvButton } from "@/components/profile/OpenTalentCvButton";
import {
  BriefcaseIcon,
  MapPinIcon,
  SparkleIcon,
} from "@/components/dashboard/icons";
import type { DiscoveryCard } from "@/components/discovery/DiscoveryScreen";

const REPORT_NAV = [
  {
    id: "why",
    title: "Why this match?",
    body: "See the key reasons behind the match.",
  },
  {
    id: "risks",
    title: "Potential risks",
    body: "Get ahead of possible misalignments.",
  },
  {
    id: "feedback",
    title: "Candidate's feedback",
    body: "Understand how they feel about the fit.",
  },
] as const;

/**
 * Company Discover desktop — mockup two-card layout (candidate + Match Report)
 * instead of dating-style swipe card + stacked report.
 */
export function CompanyDiscoverDesk({
  card,
  initialFeedback,
  viewerId,
  messageHref,
  onPass,
  onHide,
}: {
  card: DiscoveryCard;
  initialFeedback: MatchFeedbackAction | null;
  viewerId: string;
  messageHref?: string | null;
  onPass: (userId: string) => void;
  onHide: (userId: string) => void;
}) {
  const toast = useToast();
  const fullReportRef = useRef<HTMLDivElement | null>(null);
  const [supabase] = useState(() => createClient());
  const [feedback, setFeedback] = useState<MatchFeedbackAction | null>(
    initialFeedback,
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFeedback(initialFeedback);
  }, [card.userId, initialFeedback]);

  useEffect(() => {
    track(AnalyticsEvent.matchCardViewed, {
      target_user_id: card.userId,
      score: card.score,
      card_kind: card.kind ?? "person",
    });
  }, [card.userId, card.score, card.kind]);

  const tags = useMemo(() => {
    const fromSkills = card.skills?.filter(Boolean) ?? [];
    const fromTags = card.tags?.filter(Boolean) ?? [];
    return (fromSkills.length > 0 ? fromSkills : fromTags).slice(0, 6);
  }, [card.skills, card.tags]);

  const whyTags = useMemo(
    () =>
      card.report.why
        .map((b) => b.label)
        .filter(Boolean)
        .slice(0, 3),
    [card.report.why],
  );

  const metaParts = useMemo(
    () =>
      card.meta
        .split("·")
        .map((p) => p.trim())
        .filter(Boolean),
    [card.meta],
  );

  const advanceAfterInterest = () => onHide(card.userId);

  const expressInterest = async () => {
    if (feedback === "interested") {
      advanceAfterInterest();
      return;
    }
    setFeedback("interested");
    advanceAfterInterest();
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

  const scrollToFullReport = () => {
    fullReportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <motion.div
      key={card.userId}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex w-full flex-col gap-4"
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,300px)] lg:items-stretch">
        <section className="flex flex-col rounded-[28px] border border-mingle-border bg-mingle-surface p-5 shadow-mingle sm:p-6">
          <p className="font-display text-sm font-bold tracking-tight text-mingle-text">
            mingle
          </p>

          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3.5">
              <Avatar
                photo={card.photo}
                initials={card.initial}
                gender={card.gender}
                size="xl"
                shape="soft"
              />
              <div className="min-w-0">
                <h2 className="font-display text-xl font-bold tracking-tight text-mingle-text sm:text-2xl">
                  {card.name}
                </h2>
                <p className="mt-0.5 text-sm text-mingle-text-secondary">
                  {card.subtitle}
                </p>
                <ul className="mt-2.5 flex flex-col gap-1.5 text-[12px] text-mingle-text-secondary">
                  {metaParts[0] ? (
                    <li className="flex items-center gap-1.5">
                      <MapPinIcon size={14} className="shrink-0 text-mingle-blue" />
                      <span className="truncate">{metaParts[0]}</span>
                    </li>
                  ) : null}
                  {metaParts.slice(1, 3).map((part) => (
                    <li key={part} className="flex items-center gap-1.5">
                      <BriefcaseIcon
                        size={14}
                        className="shrink-0 text-mingle-blue"
                      />
                      <span className="truncate">{part}</span>
                    </li>
                  ))}
                </ul>
                {tags.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[color:var(--mingle-light-purple)] px-2.5 py-1 text-[11px] font-semibold text-mingle-text"
                      >
                        {tag}
                      </span>
                    ))}
                    {tags.length > 2 ? (
                      <span className="rounded-full bg-mingle-lavender px-2.5 py-1 text-[11px] font-semibold text-mingle-text-secondary">
                        +{tags.length - 2}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-center self-center sm:self-start">
              <MatchScoreRing score={card.score} size={96} showLabel />
            </div>
          </div>

          {whyTags.length > 0 ? (
            <div className="mt-5">
              <p className="font-display text-sm font-bold text-mingle-text">
                Why it works?
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {whyTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-[color:var(--mingle-light-purple)] px-3 py-1.5 text-[11px] font-semibold text-mingle-text"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-2">
            <FitBars axes={card.report.axes} report={card.report} />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link
              href={`/profile/view/${card.userId}`}
              onClick={() =>
                track(AnalyticsEvent.matchViewed, {
                  target_user_id: card.userId,
                  source: "discover_desk",
                })
              }
              className="rounded-full bg-mingle-cta px-5 py-2.5 font-display text-xs font-semibold text-white"
            >
              View profile
            </Link>
            {card.cvPath ? (
              <OpenTalentCvButton
                cvPath={card.cvPath}
                cvFileName={card.cvFileName}
                label={
                  card.cvFileName?.trim() ? card.cvFileName.trim() : "Open CV"
                }
                className="inline-flex max-w-[12rem] items-center justify-center truncate rounded-full border border-mingle-border bg-mingle-lavender px-4 py-2.5 font-display text-xs font-semibold text-mingle-text transition-colors hover:border-mingle-blue disabled:opacity-60"
              />
            ) : (
              <span className="rounded-full border border-dashed border-mingle-border px-4 py-2 font-display text-xs font-semibold text-mingle-text-secondary">
                No CV uploaded
              </span>
            )}
          </div>

          <div className="mt-4 border-t border-mingle-border/70 pt-3">
            <DiscoverSwipeActions
              busy={saving}
              interestedDone={feedback === "interested"}
              messageHref={messageHref}
              dragX={null}
              onSkip={() => onPass(card.userId)}
              onSave={() => void saveForLater()}
              onInterested={() => void expressInterest()}
            />
          </div>
        </section>

        <aside className="flex flex-col rounded-[28px] border border-mingle-border bg-mingle-surface p-5 shadow-mingle sm:p-6">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--mingle-light-purple)] text-mingle-purple">
              <SparkleIcon size={14} />
            </span>
            <h3 className="font-display text-base font-bold tracking-tight text-mingle-text">
              Match Report
            </h3>
          </div>

          <ul className="mt-5 flex flex-col gap-4">
            {REPORT_NAV.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={scrollToFullReport}
                  className="flex w-full items-start gap-3 text-left"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color:var(--mingle-light-blue)] text-mingle-blue">
                    <svg
                      width={12}
                      height={12}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.4}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="m5 12 5 5L20 7" />
                    </svg>
                  </span>
                  <span>
                    <span className="block font-display text-sm font-bold text-mingle-text">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block text-[12px] leading-snug text-mingle-text-secondary">
                      {item.body}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-auto flex flex-col gap-2.5 pt-6">
            <button
              type="button"
              onClick={scrollToFullReport}
              className="mingle-connection-fill w-full rounded-full px-5 py-3.5 text-center font-display text-sm font-semibold text-white"
            >
              View full report →
            </button>
            <Link
              href={`/profile/view/${card.userId}`}
              onClick={() =>
                track(AnalyticsEvent.matchViewed, {
                  target_user_id: card.userId,
                  source: "discover_desk_cta",
                })
              }
              className="w-full rounded-full bg-mingle-cta px-5 py-3.5 text-center font-display text-sm font-semibold text-white"
            >
              Start conversation →
            </Link>
          </div>
        </aside>
      </div>

      <div
        ref={fullReportRef}
        className="rounded-[28px] border border-mingle-border bg-mingle-surface p-5 shadow-mingle sm:p-6"
      >
        <p className="font-display text-sm font-bold tracking-tight text-mingle-text">
          Full match report
        </p>
        <div className="mt-4">
          <MatchReportBody
            report={card.report}
            omitOverview
            matchIds={{
              companyId: viewerId,
              candidateId: card.userId,
              roleId: null,
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}
