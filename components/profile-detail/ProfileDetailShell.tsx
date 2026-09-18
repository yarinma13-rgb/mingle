"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { sendOrAcceptConnection } from "@/lib/connections/persistence";
import { notifyConnectionRequest } from "@/lib/email/actions";
import { notifyPushMatch, notifyPushConnection } from "@/lib/push/actions";
import { isRateLimitError } from "@/lib/rate-limit";
import { saveProfile, unsaveProfile } from "@/lib/matching/saved";
import { passProfile } from "@/lib/matching/passed";
import { recordMatchFeedback, type MatchFeedbackAction, type NotFitReason } from "@/lib/matching/feedback";
import type { MatchReport } from "@/lib/matching/report";
import {
  AskMingleButton,
  MatchFeedbackActions,
  MatchReportBody,
} from "@/components/matching/MatchReport";
import { MatchScoreRing } from "@/components/matching/MatchScoreRing";
import { TalentCvField } from "@/components/profile/TalentCvField";
import { OpenTalentCvButton } from "@/components/profile/OpenTalentCvButton";
import {
  ProfileChipRow,
  ProfileSection,
} from "@/components/profile/ProfileSection";
import { Avatar } from "@/components/Avatar";
import { useToast } from "@/components/toast/ToastProvider";
import { RecommendationsList } from "@/components/recommendations/RecommendationsList";
import { RequestRecommendation } from "@/components/recommendations/RequestRecommendation";
import type { SubmittedRecommendation } from "@/lib/recommendations/persistence";
import type { ConnectionStatus } from "@/lib/supabase/types";
import type { Gender } from "@/lib/profile/avatar";

const MingleMomentOverlay = dynamic(
  () =>
    import("@/components/mingle-moment/MingleMomentOverlay").then((mod) => ({
      default: mod.MingleMomentOverlay,
    })),
  { ssr: false },
);

function BackArrowIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M19 12H5" />
      <path d="m11 6-6 6 6 6" />
    </svg>
  );
}

export type ProfileDetailSection = {
  title: string;
  chips?: string[];
  text?: string;
};

type ProfileDetailShellProps = {
  eyebrow: string;
  photo: string | null;
  initial: string;
  gender?: Gender | null;
  /** Soft mark for companies; circle for talent. */
  avatarShape?: "circle" | "soft";
  name: string;
  subtitle: string;
  meta: string;
  sections: ProfileDetailSection[];
  whyMatch: string[] | null;
  matchReport?: MatchReport | null;
  initialFeedback?: MatchFeedbackAction | null;
  whatToExplore: string[];
  viewerId: string;
  targetUserId: string;
  initialConnectionStatus: { status: ConnectionStatus; isRequester: boolean; id?: string } | null;
  initiallySaved: boolean;
  cvPath?: string | null;
  cvFileName?: string | null;
  /** When true, show CV slot under the photo even if empty (talent profiles). */
  showCv?: boolean;
  recommendations?: SubmittedRecommendation[];
  canRequestRecommendation?: boolean;
};

const CONNECT_LABEL: Record<ConnectionStatus, string> = {
  pending: "Request sent",
  accepted: "Connected",
  declined: "Start a connection",
  cancelled: "Start a connection",
};

export function ProfileDetailShell({
  eyebrow,
  photo,
  initial,
  gender = null,
  avatarShape = "circle",
  name,
  subtitle,
  meta,
  sections,
  whyMatch,
  matchReport = null,
  initialFeedback = null,
  whatToExplore,
  viewerId,
  targetUserId,
  initialConnectionStatus,
  initiallySaved,
  cvPath = null,
  cvFileName = null,
  showCv = false,
  recommendations = [],
  canRequestRecommendation = false,
}: ProfileDetailShellProps) {
  const router = useRouter();
  const toast = useToast();
  const [supabase] = useState(() => createClient());
  const [connectionState, setConnectionState] = useState(initialConnectionStatus);
  const [connecting, setConnecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(initiallySaved);
  const [feedback, setFeedback] = useState<MatchFeedbackAction | null>(
    initialFeedback,
  );
  const [connectError, setConnectError] = useState<string | null>(null);
  const [showMingleMoment, setShowMingleMoment] = useState(false);
  const [mingleConnectionId, setMingleConnectionId] = useState<string | null>(
    initialConnectionStatus?.id ?? null,
  );

  const isSelf = viewerId === targetUserId;
  const isPendingIncoming =
    connectionState?.status === "pending" && !connectionState.isRequester;

  const handleConnect = async () => {
    if (connecting || isSelf) return;
    setConnecting(true);
    setConnectError(null);
    try {
      const result = await sendOrAcceptConnection(supabase, viewerId, targetUserId);
      if (result.outcome === "mutual") {
        setConnectionState({ status: "accepted", isRequester: false });
        setMingleConnectionId(result.connection.id);
        setShowMingleMoment(true);
        void notifyPushConnection(targetUserId);
      } else if (result.outcome === "sent") {
        setConnectionState({ status: "pending", isRequester: true });
        toast("Request sent.");
        void notifyConnectionRequest(targetUserId);
      } else if (result.outcome === "already-connected") {
        setConnectionState({ status: "accepted", isRequester: true });
      } else {
        setConnectionState({ status: "pending", isRequester: true });
        toast("Request sent.");
      }
    } catch (error) {
      const message = isRateLimitError(error)
        ? error.message
        : "Couldn't send that. Try again in a moment.";
      setConnectError(message);
      toast(message, "error");
    } finally {
      setConnecting(false);
    }
  };

  const handleInterested = async () => {
    if (saving || isSelf) return;
    setSaving(true);
    try {
      await saveProfile(supabase, viewerId, targetUserId);
      await recordMatchFeedback(supabase, viewerId, targetUserId, "interested");
      setSaved(true);
      setFeedback("interested");
      toast("Marked interested.");
      void notifyPushMatch(targetUserId);
    } catch {
      toast("Couldn't save that. Try again in a moment.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleNotFit = async (reason: NotFitReason) => {
    if (saving || isSelf) return;
    setSaving(true);
    try {
      await recordMatchFeedback(
        supabase,
        viewerId,
        targetUserId,
        "not_fit",
        reason,
      );
      await passProfile(supabase, viewerId, targetUserId);
      setFeedback("not_fit");
      toast("Saved as not a fit.");
    } catch {
      toast("Couldn't save that. Try again in a moment.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (saving || isSelf) return;
    setSaving(true);
    try {
      if (saved) {
        await unsaveProfile(supabase, viewerId, targetUserId);
        setSaved(false);
        toast("Removed from saved.");
      } else {
        await saveProfile(supabase, viewerId, targetUserId);
        setSaved(true);
        toast("Saved for later.");
      }
    } catch {
      toast("Couldn't save that. Try again in a moment.", "error");
    } finally {
      setSaving(false);
    }
  };

  const connectLabel = isPendingIncoming
    ? "Accept connection"
    : connectionState
      ? CONNECT_LABEL[connectionState.status]
      : "Start a connection";
  const connectDisabled =
    connecting || connectionState?.status === "accepted" || connectionState?.status === "pending" && !isPendingIncoming;

  return (
    <div className="flex flex-1 justify-center">
      {showMingleMoment && (
        <MingleMomentOverlay
          matchName={name}
          matchUserId={targetUserId}
          connectionId={mingleConnectionId ?? undefined}
          onClose={() => {
            setShowMingleMoment(false);
            setMingleConnectionId(null);
          }}
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex w-full max-w-4xl flex-col gap-5"
      >
        <div className="sticky top-0 z-20 -mx-1 flex items-center gap-3 rounded-[16px] border border-mingle-border bg-mingle-surface/95 px-3 py-2.5 shadow-mingle backdrop-blur supports-[backdrop-filter]:bg-mingle-surface/85">
          <button
            type="button"
            onClick={() => router.back()}
            className="mingle-btn-tertiary !min-h-0 gap-1.5 !px-1 !py-1 text-sm"
          >
            <BackArrowIcon />
            Back
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-semibold text-mingle-text">
              {name}
            </p>
            <p className="truncate text-[11px] text-mingle-text-secondary">
              {subtitle}
            </p>
          </div>
          {matchReport ? (
            <MatchScoreRing
              score={matchReport.overall}
              size={52}
              showLabel
              caption={null}
            />
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(240px,280px)_minmax(0,1fr)] lg:items-start">
          <aside className="flex flex-col gap-4 lg:sticky lg:top-16">
            <div className="rounded-[20px] border border-mingle-border bg-mingle-surface p-5 shadow-mingle">
              <p className="mingle-gradient-text text-center font-display text-[11px] font-semibold uppercase tracking-[0.18em]">
                {eyebrow}
              </p>
              <div className="mt-4 flex flex-col items-center gap-3 text-center">
                {avatarShape === "soft" ? (
                  <div className="mingle-logo-tile !h-[72px] !w-[72px] !rounded-[14px]">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo} alt="" className="!p-2" />
                    ) : (
                      <span className="font-display text-2xl font-bold text-mingle-text">
                        {initial}
                      </span>
                    )}
                  </div>
                ) : (
                  <Avatar
                    photo={photo}
                    initials={initial}
                    gender={gender}
                    size="hero"
                    shape={avatarShape}
                  />
                )}
                <div>
                  <h1 className="font-display text-[28px] font-bold leading-tight tracking-tight text-mingle-text sm:text-[30px]">
                    {name}
                  </h1>
                  <p className="mt-1.5 text-[15px] font-medium leading-relaxed text-mingle-text">
                    {subtitle}
                  </p>
                  {meta ? (
                    <p className="mt-1 text-[13px] font-medium text-mingle-text-secondary">
                      {meta}
                    </p>
                  ) : null}
                </div>
              </div>

              {showCv ? (
                <div className="mt-4 flex justify-center">
                  {cvPath ? (
                    <OpenTalentCvButton
                      cvPath={cvPath}
                      cvFileName={cvFileName}
                      label={cvFileName?.trim() ? cvFileName.trim() : "Open CV"}
                      className="mingle-btn-secondary !min-h-10 max-w-full truncate !px-5 !py-2.5 text-xs"
                    />
                  ) : (
                    <span className="rounded-[12px] border border-dashed border-mingle-border px-4 py-2 font-display text-xs font-semibold text-mingle-text-secondary">
                      No CV uploaded
                    </span>
                  )}
                </div>
              ) : null}

              {!isSelf ? (
                <div className="mt-5 flex flex-col gap-2">
                  {connectError ? (
                    <p className="text-center text-sm text-mingle-pink">
                      {connectError}
                    </p>
                  ) : null}
                  {connectionState?.status === "accepted" ? (
                    <Link
                      href={
                        mingleConnectionId
                          ? `/conversations/${mingleConnectionId}`
                          : "/conversations"
                      }
                      className="mingle-btn-secondary w-full text-center text-sm"
                    >
                      Continue conversation →
                    </Link>
                  ) : (
                    <motion.button
                      type="button"
                      onClick={handleConnect}
                      disabled={connectDisabled}
                      whileHover={connectDisabled ? undefined : { scale: 1.01 }}
                      whileTap={connectDisabled ? undefined : { scale: 0.99 }}
                      className={`w-full text-center ${
                        connectDisabled
                          ? "mingle-btn-secondary cursor-not-allowed opacity-60"
                          : "mingle-btn-primary"
                      }`}
                    >
                      {connecting
                        ? "Sending…"
                        : connectDisabled
                          ? connectLabel
                          : (
                              <>
                                {connectLabel}
                                <span className="mingle-btn-arrow" aria-hidden>
                                  →
                                </span>
                              </>
                            )}
                    </motion.button>
                  )}
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    aria-pressed={saved}
                    className={`w-full text-center ${
                      saved
                        ? "mingle-btn-secondary border-mingle-purple/30 bg-[color:var(--mingle-light-purple)] text-mingle-text"
                        : "mingle-btn-secondary"
                    }`}
                  >
                    {saving ? "Saving…" : saved ? "Saved" : "Save for later"}
                  </button>
                </div>
              ) : null}
              {isSelf && showCv && cvPath ? (
                <div className="mt-5">
                  <OpenTalentCvButton
                    cvPath={cvPath}
                    cvFileName={cvFileName}
                    label={cvFileName?.trim() ? cvFileName.trim() : "Open CV"}
                    className="mingle-btn-secondary w-full text-center text-sm"
                  />
                </div>
              ) : null}
            </div>
          </aside>

          <div className="flex flex-col gap-4">
            {cvPath ? (
              <ProfileSection title="CV">
                <TalentCvField
                  supabase={supabase}
                  userId={targetUserId}
                  cvPath={cvPath}
                  cvFileName={cvFileName ?? "CV.pdf"}
                  editable={false}
                  showLabel={false}
                  onChanged={() => {}}
                />
              </ProfileSection>
            ) : null}

            {matchReport ? (
              <ProfileSection title="Match Report">
                <MatchReportBody report={matchReport} />
                <div className="mt-3 flex flex-col gap-3">
                  <MatchFeedbackActions
                    audience={matchReport.audience}
                    action={feedback}
                    busy={saving}
                    onInterested={() => void handleInterested()}
                    onNotFit={(reason) => void handleNotFit(reason)}
                  />
                  <AskMingleButton report={matchReport} />
                </div>
              </ProfileSection>
            ) : whyMatch ? (
              <ProfileSection title="Why it works">
                <ul className="flex flex-col gap-2">
                  {whyMatch.map((reason) => (
                    <li
                      key={reason}
                      className="flex gap-2 text-sm leading-relaxed text-mingle-text"
                    >
                      <span
                        aria-hidden
                        className="mt-0.5 shrink-0 font-bold text-mingle-accent-purple"
                      >
                        ✓
                      </span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </ProfileSection>
            ) : null}

            {sections.map((section, index) => {
              const chips = section.chips?.filter(Boolean) ?? [];
              const text = section.text?.trim() ?? "";
              const empty = chips.length === 0 && !text;
              return (
                <ProfileSection
                  key={section.title}
                  title={section.title}
                  elevated={index % 2 === 1}
                  empty={empty}
                >
                  {chips.length > 0 ? <ProfileChipRow items={chips} /> : null}
                  {text ? (
                    <p
                      dir="auto"
                      className="whitespace-pre-wrap text-sm leading-relaxed text-mingle-text-secondary"
                    >
                      {text}
                    </p>
                  ) : null}
                </ProfileSection>
              );
            })}

            {(recommendations.length > 0 ||
              (canRequestRecommendation && isSelf)) && (
              <ProfileSection title="Recommendations" elevated>
                <RecommendationsList items={recommendations} />
                {canRequestRecommendation && isSelf ? (
                  <div
                    className={recommendations.length > 0 ? "mt-2" : undefined}
                  >
                    <RequestRecommendation />
                  </div>
                ) : null}
              </ProfileSection>
            )}

            {whatToExplore.length > 0 ? (
              <ProfileSection title="What to explore">
                <ul className="flex flex-col gap-2">
                  {whatToExplore.map((prompt) => (
                    <li
                      key={prompt}
                      className="flex gap-2 text-sm leading-relaxed text-mingle-text-secondary"
                    >
                      <span
                        aria-hidden
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mingle-purple"
                      />
                      {prompt}
                    </li>
                  ))}
                </ul>
              </ProfileSection>
            ) : null}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
