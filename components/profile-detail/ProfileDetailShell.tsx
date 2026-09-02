"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { sendOrAcceptConnection } from "@/lib/connections/persistence";
import { isRateLimitError } from "@/lib/rate-limit";
import { saveProfile, unsaveProfile } from "@/lib/matching/saved";
import { MingleMomentOverlay } from "@/components/mingle-moment/MingleMomentOverlay";
import { TalentCvField } from "@/components/profile/TalentCvField";
import { useToast } from "@/components/toast/ToastProvider";
import type { ConnectionStatus } from "@/lib/supabase/types";

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

function ChipRow({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full bg-mingle-purple/15 px-3 py-1.5 text-xs font-medium text-mingle-white"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-mingle-surface p-5">
      <h2 className="font-display text-sm font-semibold text-mingle-white">
        {title}
      </h2>
      {children}
    </div>
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
  name: string;
  subtitle: string;
  meta: string;
  sections: ProfileDetailSection[];
  whyMatch: string[] | null;
  whatToExplore: string[];
  viewerId: string;
  targetUserId: string;
  initialConnectionStatus: { status: ConnectionStatus; isRequester: boolean } | null;
  initiallySaved: boolean;
  cvPath?: string | null;
  cvFileName?: string | null;
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
  name,
  subtitle,
  meta,
  sections,
  whyMatch,
  whatToExplore,
  viewerId,
  targetUserId,
  initialConnectionStatus,
  initiallySaved,
  cvPath = null,
  cvFileName = null,
}: ProfileDetailShellProps) {
  const router = useRouter();
  const toast = useToast();
  const [supabase] = useState(() => createClient());
  const [connectionState, setConnectionState] = useState(initialConnectionStatus);
  const [connecting, setConnecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(initiallySaved);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [showMingleMoment, setShowMingleMoment] = useState(false);

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
        setShowMingleMoment(true);
      } else if (result.outcome === "sent") {
        setConnectionState({ status: "pending", isRequester: true });
        toast("Request sent.");
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
    <div className="flex min-h-screen flex-1 justify-center px-4 py-10 sm:px-10 sm:py-16">
      {showMingleMoment && (
        <MingleMomentOverlay
          matchName={name}
          matchUserId={targetUserId}
          onClose={() => setShowMingleMoment(false)}
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex w-full max-w-lg flex-col gap-6"
      >
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 self-start text-sm font-medium text-mingle-text-secondary transition-colors hover:text-mingle-white"
        >
          <BackArrowIcon />
          Back
        </button>

        <div className="flex flex-col items-center text-center">
          <span className="mingle-gradient-text font-display text-xs font-semibold uppercase tracking-[0.16em]">
            {eyebrow}
          </span>
        </div>

        <div className="flex flex-col items-center gap-3 text-center">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt=""
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-mingle-pink to-mingle-purple font-display text-xl font-bold text-mingle-white">
              {initial || "?"}
            </div>
          )}
          <div>
            <h1 className="font-display text-2xl font-bold text-mingle-white">
              {name}
            </h1>
            <p className="mt-1 text-sm text-mingle-text-secondary">
              {subtitle}
            </p>
            {meta && (
              <p className="mt-1 text-xs text-mingle-text-secondary">
                {meta}
              </p>
            )}
          </div>
        </div>

        {cvPath && cvFileName && (
          <Section title="CV">
            <TalentCvField
              supabase={supabase}
              userId={targetUserId}
              cvPath={cvPath}
              cvFileName={cvFileName}
              editable={false}
              showLabel={false}
              onChanged={() => {}}
            />
          </Section>
        )}

        {whyMatch && (
          <Section title="Why this could be a match">
            <ul className="flex flex-col gap-2">
              {whyMatch.map((reason) => (
                <li
                  key={reason}
                  className="flex gap-2 text-sm text-mingle-text-secondary"
                >
                  <span
                    aria-hidden
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mingle-pink"
                  />
                  {reason}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {sections.map((section) => (
          <Section key={section.title} title={section.title}>
            {section.chips && <ChipRow items={section.chips} />}
            {section.text && (
              <p className="whitespace-pre-wrap text-sm text-mingle-text-secondary">
                {section.text}
              </p>
            )}
          </Section>
        ))}

        <Section title="What to explore">
          <ul className="flex flex-col gap-2">
            {whatToExplore.map((prompt) => (
              <li
                key={prompt}
                className="flex gap-2 text-sm text-mingle-text-secondary"
              >
                <span
                  aria-hidden
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mingle-purple"
                />
                {prompt}
              </li>
            ))}
          </ul>
        </Section>

        {!isSelf && (
          <div className="mt-2 flex flex-col gap-3">
            {connectError && (
              <p className="text-center text-sm text-mingle-pink">
                {connectError}
              </p>
            )}
            <motion.button
              type="button"
              onClick={handleConnect}
              disabled={connectDisabled}
              whileHover={connectDisabled ? undefined : { scale: 1.02 }}
              whileTap={connectDisabled ? undefined : { scale: 0.98 }}
              className={`rounded-full px-8 py-3.5 text-center font-display text-sm font-semibold transition-colors ${
                connectDisabled
                  ? "cursor-not-allowed bg-mingle-surface text-mingle-text-secondary"
                  : "bg-mingle-cta text-mingle-white"
              }`}
            >
              {connecting ? "Sending…" : connectLabel}
            </motion.button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-mingle-surface px-8 py-3.5 text-center font-display text-sm font-semibold text-mingle-white transition-colors hover:bg-mingle-surface/70 disabled:opacity-60"
            >
              {saving ? "Saving…" : saved ? "Saved" : "Save for later"}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
