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
import { saveProfile, unsaveProfile } from "@/lib/matching/saved";
import { passProfile, unpassProfile } from "@/lib/matching/passed";
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

function FactorRow({ factor }: { factor: MatchFactor }) {
  return (
    <div className="flex flex-col gap-0.5 py-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-mingle-text">
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
  swipeEnabled,
  onPass,
  onHide,
}: {
  card: DiscoveryCard;
  initiallySaved: boolean;
  swipeEnabled: boolean;
  onPass: (userId: string) => void;
  onHide: (userId: string) => void;
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
      className={`relative mx-auto flex w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-mingle-border bg-mingle-surface shadow-mingle ${
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
            className="h-full w-full object-cover"
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
            <MingleChip className="shrink-0 border-white/20 bg-white/15 text-[11px] text-white">
              {card.score}% match
            </MingleChip>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
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
        <div className="px-4">
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

      {isMobile && swipeEnabled && (
        <p className="px-4 text-center text-[11px] text-mingle-text-secondary">
          Swipe right for interested, left to skip — or use the buttons below.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 p-4 pt-0">
        <Link
          href={`/profile/view/${card.userId}`}
          className="rounded-full bg-mingle-cta px-4 py-2 font-display text-xs font-semibold text-white"
        >
          View profile
        </Link>
        <button
          type="button"
          onClick={toggleSaveFromButton}
          disabled={saving}
          className={`rounded-full px-4 py-2 font-display text-xs font-semibold transition-colors disabled:opacity-60 ${
            saved
              ? "bg-mingle-blue/15 text-mingle-blue"
              : "bg-mingle-lavender text-mingle-text hover:bg-mingle-lavender/80"
          }`}
        >
          {saved ? "Saved" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => onPass(card.userId)}
          className="ml-auto rounded-full px-4 py-2 font-display text-xs font-semibold text-mingle-text-secondary hover:text-mingle-text"
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
  viewerId,
  mode = "feed",
  emptyBody,
}: {
  title: string;
  subtitle: string;
  cards: DiscoveryCard[];
  savedUserIds: string[];
  viewerId: string;
  mode?: "feed" | "passed";
  emptyBody?: string;
}) {
  const toast = useToast();
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [cards, setCards] = useState(initialCards);
  const savedSet = new Set(savedUserIds);
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
                {card.score}% match
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
              initiallySaved={savedSet.has(card.userId)}
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
