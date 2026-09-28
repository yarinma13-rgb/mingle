"use client";

import { useMemo, useRef, useState } from "react";
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
  FitBars,
  MatchFeedbackActions,
  MatchReportBody,
} from "@/components/matching/MatchReport";
import { MatchScoreRing } from "@/components/matching/MatchScoreRing";
import { CollaboratorRow } from "@/components/matching/CollaboratorRow";
import type { MatchCollaboratorRow } from "@/lib/collaborators/persistence";
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
import {
  BriefcaseIcon,
  GraduationCapIcon,
  MapPinIcon,
  SparkleIcon,
} from "@/components/dashboard/icons";

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
  /** Present only when viewer is a company user and an accepted connection exists. */
  connectionId?: string | null;
  companyId?: string;
  initialCollaborators?: MatchCollaboratorRow[];
  activeTeamMembers?: { userId: string; email: string }[];
};

const CONNECT_LABEL: Record<ConnectionStatus, string> = {
  pending: "Request sent",
  accepted: "Connected",
  declined: "Start a connection",
  cancelled: "Start a connection",
};

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

function skillTagsFromSections(sections: ProfileDetailSection[]): string[] {
  const skills = sections.find((s) => s.title === "Skills")?.chips ?? [];
  return skills.filter(Boolean);
}

function metaRows(meta: string, sections: ProfileDetailSection[]) {
  const parts = meta
    .split("·")
    .map((p) => p.trim())
    .filter(Boolean);
  const location = parts[0] ?? "";
  const about = sections.find((s) => s.title === "About")?.text ?? "";
  const aboutParts = about
    .split("·")
    .map((p) => p.trim())
    .filter(Boolean);
  const experience =
    aboutParts.find((p) => /year|yrs|experience|\d+\+/i.test(p)) ??
    aboutParts[0] ??
    "";
  const education =
    aboutParts.find((p) => /B\.|M\.|PhD|degree|computer|science|BA|BS/i.test(p)) ??
    aboutParts[1] ??
    "";
  return { location, experience, education };
}

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
  connectionId = null,
  companyId,
  initialCollaborators = [],
  activeTeamMembers = [],
}: ProfileDetailShellProps) {
  const router = useRouter();
  const toast = useToast();
  const fullReportRef = useRef<HTMLDivElement | null>(null);
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
  const [mingleIsFirstMatch, setMingleIsFirstMatch] = useState(false);
  const [fullReportOpen, setFullReportOpen] = useState(true);

  const isSelf = viewerId === targetUserId;
  const isPendingIncoming =
    connectionState?.status === "pending" && !connectionState.isRequester;
  const companyTalentView =
    matchReport?.audience === "company" && showCv && !isSelf;

  const tags = useMemo(() => skillTagsFromSections(sections), [sections]);
  const rows = useMemo(() => metaRows(meta, sections), [meta, sections]);
  const whyTags = useMemo(
    () =>
      (matchReport?.why ?? [])
        .map((b) => b.label)
        .filter(Boolean)
        .slice(0, 3),
    [matchReport],
  );

  const handleConnect = async () => {
    if (connecting || isSelf) return;
    setConnecting(true);
    setConnectError(null);
    try {
      const result = await sendOrAcceptConnection(supabase, viewerId, targetUserId);
      if (result.outcome === "mutual") {
        setConnectionState({ status: "accepted", isRequester: false });
        setMingleConnectionId(result.connection.id);
        setMingleIsFirstMatch(result.isFirstMingle);
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
      : "Start conversation";
  const connectDisabled =
    connecting || connectionState?.status === "accepted" || connectionState?.status === "pending" && !isPendingIncoming;

  const scrollToFullReport = () => {
    setFullReportOpen(true);
    requestAnimationFrame(() => {
      fullReportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const connectCta = !isSelf ? (
    <div className="flex flex-col gap-2">
      {connectError ? (
        <p className="text-center text-sm text-mingle-pink">{connectError}</p>
      ) : null}
      {connectionState?.status === "accepted" ? (
        <Link
          href={
            mingleConnectionId
              ? `/conversations/${mingleConnectionId}`
              : "/conversations"
          }
          className="rounded-full bg-mingle-success/15 px-6 py-3 text-center font-display text-sm font-semibold text-mingle-success transition-colors hover:bg-mingle-success/25"
        >
          ✓ Connected · Open chat
        </Link>
      ) : (
        <motion.button
          type="button"
          onClick={handleConnect}
          disabled={connectDisabled}
          whileHover={connectDisabled ? undefined : { scale: 1.02 }}
          whileTap={connectDisabled ? undefined : { scale: 0.98 }}
          className={`rounded-full px-6 py-3.5 text-center font-display text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60 ${
            connectDisabled ? "bg-mingle-lavender !text-mingle-text-secondary" : "mingle-connection-fill"
          }`}
        >
          {connecting ? "Sending…" : `${connectLabel} →`}
        </motion.button>
      )}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        aria-pressed={saved}
        className={`rounded-full border px-6 py-3 text-center font-display text-sm font-semibold transition-colors disabled:opacity-60 ${
          saved
            ? "border-mingle-purple/40 bg-mingle-purple/15 text-mingle-purple"
            : "border-mingle-border bg-mingle-white text-mingle-text hover:bg-mingle-lavender"
        }`}
      >
        {saving ? "Saving…" : saved ? "★ Saved" : "Save for later"}
      </button>
    </div>
  ) : null;

  const profileSections = (
    <>
      {cvPath && !companyTalentView ? (
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
            <div className={recommendations.length > 0 ? "mt-2" : undefined}>
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
    </>
  );

  return (
    <div className="flex flex-1 justify-center">
      {showMingleMoment && (
        <MingleMomentOverlay
          matchName={name}
          matchUserId={targetUserId}
          connectionId={mingleConnectionId ?? undefined}
          isFirstMatch={mingleIsFirstMatch}
          onClose={() => {
            setShowMingleMoment(false);
            setMingleConnectionId(null);
            setMingleIsFirstMatch(false);
          }}
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={`flex w-full flex-col gap-5 ${
          companyTalentView ? "max-w-5xl" : "max-w-4xl"
        }`}
      >
        <div className="sticky top-0 z-20 -mx-1 flex items-center gap-3 rounded-2xl border border-mingle-border/80 bg-mingle-surface/95 px-3 py-2.5 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-mingle-surface/85">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm font-medium text-mingle-text-secondary transition-colors hover:text-mingle-text"
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
            <MatchScoreRing score={matchReport.overall} size={44} showLabel />
          ) : null}
        </div>

        {companyTalentView && matchReport ? (
          <>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,300px)] lg:items-stretch">
              {/* Left — candidate + fit axes */}
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: "easeOut", delay: 0.05 }}
                className="flex flex-col rounded-[28px] border border-mingle-border bg-mingle-surface p-5 shadow-mingle sm:p-6"
              >
                <p className="font-display text-sm font-bold tracking-tight text-mingle-text">
                  mingle
                </p>

                <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3.5">
                    <Avatar
                      photo={photo}
                      initials={initial}
                      gender={gender}
                      size="xl"
                      shape="soft"
                    />
                    <div className="min-w-0">
                      <h1 className="font-display text-xl font-bold tracking-tight text-mingle-text sm:text-2xl">
                        {name}
                      </h1>
                      <p className="mt-0.5 text-sm text-mingle-text-secondary">
                        {subtitle}
                      </p>
                      <ul className="mt-2.5 flex flex-col gap-1.5 text-[12px] text-mingle-text-secondary">
                        {rows.location ? (
                          <li className="flex items-center gap-1.5">
                            <MapPinIcon size={14} className="shrink-0 text-mingle-blue" />
                            <span>{rows.location}</span>
                          </li>
                        ) : null}
                        {rows.experience ? (
                          <li className="flex items-center gap-1.5">
                            <BriefcaseIcon size={14} className="shrink-0 text-mingle-blue" />
                            <span>{rows.experience}</span>
                          </li>
                        ) : null}
                        {rows.education ? (
                          <li className="flex items-center gap-1.5">
                            <GraduationCapIcon size={14} className="shrink-0 text-mingle-blue" />
                            <span>{rows.education}</span>
                          </li>
                        ) : null}
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

                  <div className="flex shrink-0 flex-col items-center gap-2 self-center sm:self-start">
                    <MatchScoreRing
                      score={matchReport.overall}
                      size={96}
                      showLabel
                    />
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
                  <FitBars axes={matchReport.axes} report={matchReport} />
                </div>

                {showCv ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {cvPath ? (
                      <OpenTalentCvButton
                        cvPath={cvPath}
                        cvFileName={cvFileName}
                        label={cvFileName?.trim() ? cvFileName.trim() : "Open CV"}
                        className="inline-flex max-w-full items-center justify-center truncate rounded-full border border-mingle-border bg-mingle-lavender px-5 py-2.5 font-display text-xs font-semibold text-mingle-text transition-colors hover:border-mingle-blue disabled:opacity-60"
                      />
                    ) : (
                      <span className="rounded-full border border-dashed border-mingle-border px-4 py-2 font-display text-xs font-semibold text-mingle-text-secondary">
                        No CV uploaded
                      </span>
                    )}
                  </div>
                ) : null}
              </motion.section>

              {/* Right — Match Report sidebar */}
              <motion.aside
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: "easeOut", delay: 0.12 }}
                className="flex flex-col rounded-[28px] border border-mingle-border bg-mingle-surface p-5 shadow-mingle sm:p-6"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--mingle-light-purple)] text-mingle-purple">
                    <SparkleIcon size={14} />
                  </span>
                  <h2 className="font-display text-base font-bold tracking-tight text-mingle-text">
                    Match Report
                  </h2>
                </div>

                <ul className="mt-5 flex flex-1 flex-col gap-4">
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

                <div className="mt-6 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={scrollToFullReport}
                    className="mingle-connection-fill w-full rounded-full px-5 py-3.5 text-center font-display text-sm font-semibold text-white"
                  >
                    View full report →
                  </button>
                  {connectCta}
                  {matchReport ? (
                    <MatchFeedbackActions
                      audience={matchReport.audience}
                      action={feedback}
                      busy={saving}
                      onInterested={() => void handleInterested()}
                      onNotFit={(reason) => void handleNotFit(reason)}
                    />
                  ) : null}
                  {connectionId && companyId ? (
                    <CollaboratorRow
                      connectionId={connectionId}
                      companyId={companyId}
                      currentUserId={viewerId}
                      initialCollaborators={initialCollaborators}
                      teamMembers={activeTeamMembers}
                    />
                  ) : null}
                </div>
              </motion.aside>
            </div>

            <div ref={fullReportRef}>
              {fullReportOpen ? (
                <ProfileSection title="Full match report">
                  <MatchReportBody
                    report={matchReport}
                    omitOverview
                    matchIds={{
                      companyId: viewerId,
                      candidateId: targetUserId,
                    }}
                  />
                </ProfileSection>
              ) : null}
            </div>

            <div className="flex flex-col gap-4">{profileSections}</div>
          </>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(240px,280px)_minmax(0,1fr)] lg:items-start">
            <aside className="flex flex-col gap-4 lg:sticky lg:top-16">
              <div className="rounded-3xl border border-mingle-border bg-mingle-surface p-5 shadow-mingle">
                <p className="mingle-gradient-text text-center font-display text-[11px] font-semibold uppercase tracking-[0.18em]">
                  {eyebrow}
                </p>
                <div className="mt-4 flex flex-col items-center gap-3 text-center">
                  <Avatar
                    photo={photo}
                    initials={initial}
                    gender={gender}
                    size="hero"
                    shape={avatarShape}
                  />
                  <div>
                    <h1 className="font-display text-xl font-bold leading-tight tracking-tight text-mingle-text sm:text-2xl">
                      {name}
                    </h1>
                    <p className="mt-1.5 text-sm leading-relaxed text-mingle-text-secondary">
                      {subtitle}
                    </p>
                    {meta ? (
                      <p className="mt-1 text-xs font-medium text-mingle-text-secondary/90">
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
                        className="inline-flex max-w-full items-center justify-center truncate rounded-full border border-mingle-border bg-mingle-lavender px-5 py-2.5 font-display text-xs font-semibold text-mingle-text transition-colors hover:border-mingle-blue disabled:opacity-60"
                      />
                    ) : (
                      <span className="rounded-full border border-dashed border-mingle-border px-4 py-2 font-display text-xs font-semibold text-mingle-text-secondary">
                        No CV uploaded
                      </span>
                    )}
                  </div>
                ) : null}

                {connectCta}
                {isSelf && showCv && cvPath ? (
                  <div className="mt-5">
                    <OpenTalentCvButton
                      cvPath={cvPath}
                      cvFileName={cvFileName}
                      label={cvFileName?.trim() ? cvFileName.trim() : "Open CV"}
                      className="w-full rounded-full border border-mingle-border bg-mingle-white px-6 py-3 text-center font-display text-sm font-semibold text-mingle-text transition-colors hover:bg-mingle-lavender disabled:opacity-60"
                    />
                  </div>
                ) : null}
              </div>
            </aside>

            <div className="flex flex-col gap-4">
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
                  </div>
                  {matchReport.audience === "company" && connectionId && companyId ? (
                    <div className="mt-3">
                      <CollaboratorRow
                        connectionId={connectionId}
                        companyId={companyId}
                        currentUserId={viewerId}
                        initialCollaborators={initialCollaborators}
                        teamMembers={activeTeamMembers}
                      />
                    </div>
                  ) : null}
                </ProfileSection>
              ) : whyMatch ? (
                <ProfileSection title="Why this could be a match">
                  <ul className="flex flex-col gap-2">
                    {whyMatch.map((reason) => (
                      <li
                        key={reason}
                        className="flex gap-2 text-sm leading-relaxed text-mingle-text-secondary"
                      >
                        <span
                          aria-hidden
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mingle-pink"
                        />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </ProfileSection>
              ) : null}

              {profileSections}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
