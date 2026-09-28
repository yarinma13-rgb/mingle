"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
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
import { DiscoverSwipeActions } from "@/components/discovery/DiscoverSwipeActions";
import {
  BriefcaseIcon,
  GraduationCapIcon,
  MapPinIcon,
} from "@/components/dashboard/icons";
import type { DiscoveryCard } from "@/components/discovery/DiscoveryScreen";

/**
 * Company Discover desktop — one-to-one with the product mockup:
 * single white card, photo + meta left, match ring + Why it works + CTA right.
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

  const whyTags = useMemo(() => {
    // Mockup uses short chips: Values / Work style / Career goals
    const SHORT: Partial<Record<string, string>> = {
      motivations: "Values",
      workStyle: "Work style",
      careerGoals: "Career goals",
      skills: "Skills",
      experience: "Experience",
      industry: "Industry",
      location: "Location",
      companyStage: "Stage",
    };
    const seen = new Set<string>();
    const tags: string[] = [];
    for (const bullet of card.report.why) {
      const label = SHORT[bullet.key] ?? bullet.label;
      if (!label || seen.has(label)) continue;
      seen.add(label);
      tags.push(label);
      if (tags.length >= 3) break;
    }
    return tags;
  }, [card.report.why]);

  const metaParts = useMemo(
    () =>
      card.meta
        .split("·")
        .map((p) => p.trim())
        .filter(Boolean),
    [card.meta],
  );

  const location = metaParts[0] ?? card.locationLabel ?? "";
  const experience =
    metaParts.find((p) => /year|yrs|experience|\d+\+/i.test(p)) ??
    metaParts[1] ??
    "";
  const education =
    metaParts.find((p) => /B\.|M\.|PhD|degree|computer|science|BA|BS/i.test(p)) ??
    metaParts[2] ??
    "";

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

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={card.userId}
        initial={{ opacity: 0, x: 28 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="mx-auto flex w-full max-w-3xl flex-col gap-5"
      >
        <article className="relative overflow-hidden rounded-[28px] border border-mingle-border/60 bg-mingle-surface p-6 shadow-[0_12px_40px_rgba(28,27,46,0.08)] sm:p-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)] sm:items-stretch">
            {/* Left — identity */}
            <div className="flex flex-col">
              <Avatar
                photo={card.photo}
                initials={card.initial}
                gender={card.gender}
                size="portrait"
                shape="soft"
              />
              <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-mingle-text">
                {card.name}
              </h2>
              <p className="mt-1 text-[15px] text-mingle-text-secondary">
                {card.subtitle}
              </p>
              <ul className="mt-4 flex flex-col gap-2 text-[13px] text-mingle-text-secondary">
                {location ? (
                  <li className="flex items-center gap-2">
                    <MapPinIcon size={15} className="shrink-0 text-mingle-blue" />
                    <span>{location}</span>
                  </li>
                ) : null}
                {experience ? (
                  <li className="flex items-center gap-2">
                    <BriefcaseIcon
                      size={15}
                      className="shrink-0 text-mingle-blue"
                    />
                    <span>{experience}</span>
                  </li>
                ) : null}
                {education ? (
                  <li className="flex items-center gap-2">
                    <GraduationCapIcon
                      size={15}
                      className="shrink-0 text-mingle-blue"
                    />
                    <span>{education}</span>
                  </li>
                ) : null}
              </ul>
            </div>

            {/* Right — match + why + CTA */}
            <div className="flex min-h-full flex-col">
              <div className="flex items-center gap-3">
                <MatchScoreRing
                  score={card.score}
                  size={104}
                  showLabel
                  labelBeside
                />
              </div>

              {whyTags.length > 0 ? (
                <div className="mt-7">
                  <p className="font-display text-[15px] font-bold text-mingle-text">
                    Why it works?
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {whyTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[#efe8fe] px-3.5 py-1.5 text-[12px] font-semibold text-[#6b3fd4]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-auto flex flex-col gap-3 pt-8">
                {messageHref ? (
                  <Link
                    href={messageHref}
                    className="mingle-connection-fill inline-flex w-full items-center justify-center rounded-full px-6 py-3.5 font-display text-sm font-semibold text-white shadow-[0_10px_28px_rgba(235,89,168,0.28)] transition-transform hover:scale-[1.01] active:scale-[0.99] sm:w-auto sm:self-end"
                  >
                    Open conversation →
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void expressInterest()}
                    className="mingle-connection-fill inline-flex w-full items-center justify-center rounded-full px-6 py-3.5 font-display text-sm font-semibold text-white shadow-[0_10px_28px_rgba(235,89,168,0.28)] transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 sm:w-auto sm:self-end"
                  >
                    Start conversation →
                  </button>
                )}
                <Link
                  href={`/profile/view/${card.userId}`}
                  onClick={() =>
                    track(AnalyticsEvent.matchViewed, {
                      target_user_id: card.userId,
                      source: "discover_desk",
                    })
                  }
                  className="self-end text-[12px] font-semibold text-mingle-text-secondary underline decoration-dotted underline-offset-2 hover:text-mingle-text"
                >
                  View full profile & match report
                </Link>
              </div>
            </div>
          </div>
        </article>

        <div className="flex justify-center">
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
      </motion.div>
    </AnimatePresence>
  );
}
