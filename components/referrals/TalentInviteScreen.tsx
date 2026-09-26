"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MingleLogo } from "@/components/MingleLogo";
import { ProfileBuildChrome } from "@/components/profile/ProfileBuildChrome";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/toast/ToastProvider";
import {
  bumpTalentReferralShareAction,
  ensureTalentReferralCodeAction,
} from "@/lib/talent-referrals/actions";
import { talentInviteShareUrl } from "@/lib/talent-referrals/client";
import { AnalyticsEvent } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";

type ShareChannel = "copy" | "whatsapp" | "linkedin" | "email" | "native";

const SHARE_COPY =
  "I joined mingle to discover where I actually fit. Thought you might too:";

function friendsLabel(count: number): string {
  if (count <= 0) return "Invite someone you trust to find their fit.";
  if (count === 1) return "1 friend joined through you";
  return `${count} friends joined through you`;
}

export function TalentInviteScreen({
  onDone,
  friendsJoined = 0,
  compact = false,
}: {
  onDone: () => void;
  friendsJoined?: number;
  /** Dashboard embed — less page chrome. */
  compact?: boolean;
}) {
  const toast = useToast();
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [busyChannel, setBusyChannel] = useState<ShareChannel | null>(null);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await ensureTalentReferralCodeAction();
      if (cancelled) return;
      if (!result.ok) {
        setUnavailable(true);
        setLoading(false);
        return;
      }
      setCode(result.code);
      setLoading(false);
      track(AnalyticsEvent.talentReferralInviteShown, { code: result.code });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setCanNativeShare(
      typeof navigator !== "undefined" && typeof navigator.share === "function",
    );
  }, []);

  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://mingle.careers";
  const link = code ? talentInviteShareUrl(origin, code) : "";

  const recordShare = async (channel: ShareChannel) => {
    if (!code) return;
    setBusyChannel(channel);
    try {
      await bumpTalentReferralShareAction({ code, channel });
      track(AnalyticsEvent.talentReferralShared, { code, channel });
    } catch {
      // ignore
    } finally {
      setBusyChannel(null);
    }
  };

  const handleCopy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      await recordShare("copy");
      toast("Invite link copied");
    } catch {
      toast("Couldn't copy the link. Try again.", "error");
    }
  };

  const handleWhatsApp = async () => {
    if (!link) return;
    const text = encodeURIComponent(`${SHARE_COPY}\n${link}`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
    await recordShare("whatsapp");
  };

  const handleLinkedIn = async () => {
    if (!link) return;
    const url = encodeURIComponent(link);
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      "_blank",
      "noopener,noreferrer",
    );
    await recordShare("linkedin");
  };

  const handleEmail = async () => {
    if (!link) return;
    const subject = encodeURIComponent("Join me on mingle");
    const body = encodeURIComponent(`${SHARE_COPY}\n\n${link}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    await recordShare("email");
  };

  const handleNativeShare = async () => {
    if (!link || !navigator.share) return;
    try {
      await navigator.share({
        title: "mingle",
        text: SHARE_COPY,
        url: link,
      });
      await recordShare("native");
    } catch {
      // user cancelled — ignore
    }
  };

  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`flex w-full flex-col ${compact ? "gap-5" : "max-w-md gap-6"}`}
    >
      {!compact ? (
        <div className="flex flex-col items-center text-center">
          <MingleLogo variant="mark" size={40} className="mb-4" />
          <span className="mingle-gradient-text font-display text-[11px] font-semibold uppercase tracking-[0.18em]">
            mingle
          </span>
        </div>
      ) : null}

      <div className={compact ? "" : "text-center"}>
        <h1
          className={`font-display font-bold tracking-tight text-mingle-text ${
            compact ? "text-lg" : "text-[1.65rem] leading-tight sm:text-3xl"
          }`}
        >
          Know someone who should be on mingle?
        </h1>
        <p
          className={`mt-2 text-sm leading-relaxed text-mingle-text-secondary ${
            compact ? "" : "mx-auto max-w-sm"
          }`}
        >
          Invite a friend or colleague to discover where they actually fit.
        </p>
        <p className="mt-3 text-xs font-medium text-mingle-text-secondary/90">
          {friendsLabel(friendsJoined)}
        </p>
      </div>

      <div className="rounded-2xl border border-mingle-border bg-mingle-white/80 p-5 shadow-mingle backdrop-blur-sm">
        <ol className="flex flex-col gap-3 text-sm text-mingle-text-secondary">
          <li className="flex gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mingle-lavender font-display text-[11px] font-semibold text-mingle-text">
              1
            </span>
            <span>Share your personal invite link.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mingle-lavender font-display text-[11px] font-semibold text-mingle-text">
              2
            </span>
            <span>They join and build their profile on mingle.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mingle-lavender font-display text-[11px] font-semibold text-mingle-text">
              3
            </span>
            <span>They discover roles and matches that fit them.</span>
          </li>
        </ol>
        <p className="mt-4 text-xs leading-relaxed text-mingle-text-secondary">
          Invite more people. Discover more possibilities.
        </p>
      </div>

      {loading ? (
        <div className="h-11 animate-pulse rounded-xl bg-mingle-lavender/70" />
      ) : unavailable ? (
        <p className="text-center text-sm text-mingle-text-secondary">
          Invites will be ready shortly. You can continue for now.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <Button
            type="button"
            variant="primary"
            className="w-full"
            onClick={() => {
              setShareOpen(true);
              track(AnalyticsEvent.talentReferralInviteOpened, {
                code: code ?? "",
              });
            }}
          >
            Invite someone
          </Button>

          <AnimatePresence initial={false}>
            {shareOpen ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="rounded-2xl border border-mingle-border bg-mingle-bg p-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-mingle-text-secondary">
                    Your invite link
                  </p>
                  <div className="flex items-center gap-2 rounded-xl border border-mingle-border bg-mingle-white px-3 py-2.5">
                    <p className="min-w-0 flex-1 truncate font-mono text-xs text-mingle-text">
                      {link}
                    </p>
                    <button
                      type="button"
                      onClick={() => void handleCopy()}
                      disabled={busyChannel === "copy"}
                      className="shrink-0 text-xs font-semibold text-mingle-blue transition-colors hover:text-mingle-cta disabled:opacity-60"
                    >
                      Copy
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <ShareChip
                      label="WhatsApp"
                      onClick={() => void handleWhatsApp()}
                      busy={busyChannel === "whatsapp"}
                    />
                    <ShareChip
                      label="LinkedIn"
                      onClick={() => void handleLinkedIn()}
                      busy={busyChannel === "linkedin"}
                    />
                    <ShareChip
                      label="Email"
                      onClick={() => void handleEmail()}
                      busy={busyChannel === "email"}
                    />
                    {canNativeShare ? (
                      <ShareChip
                        label="Share"
                        onClick={() => void handleNativeShare()}
                        busy={busyChannel === "native"}
                      />
                    ) : null}
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <Button
            type="button"
            variant="tertiary"
            className="w-full"
            onClick={() => {
              track(AnalyticsEvent.talentReferralInviteDismissed, {
                code: code ?? "",
              });
              onDone();
            }}
          >
            Maybe later
          </Button>
        </div>
      )}

      {unavailable && !loading ? (
        <Button type="button" variant="primary" className="w-full" onClick={onDone}>
          Continue
        </Button>
      ) : null}
    </motion.div>
  );

  if (compact) {
    return (
      <div className="rounded-2xl border border-mingle-border bg-mingle-surface-elevated p-6 shadow-mingle sm:p-7">
        {inner}
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-1 justify-center px-5 py-12 sm:px-10 sm:py-16">
      <ProfileBuildChrome />
      {inner}
    </div>
  );
}

function ShareChip({
  label,
  onClick,
  busy,
}: {
  label: string;
  onClick: () => void;
  busy: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="rounded-xl border border-mingle-border bg-mingle-white px-3 py-2.5 text-xs font-semibold text-mingle-text transition-colors hover:border-mingle-blue/40 hover:bg-mingle-lavender/50 disabled:opacity-60"
    >
      {label}
    </button>
  );
}
