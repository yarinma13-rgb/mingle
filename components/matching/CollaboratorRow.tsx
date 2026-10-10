"use client";

import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { MingleChip } from "@/components/MingleChip";
import { useToast } from "@/components/toast/ToastProvider";
import {
  inviteCollaboratorAction,
  submitCollaboratorFeedbackAction,
} from "@/lib/collaborators/actions";
import type {
  CollaboratorTone,
  MatchCollaboratorRow,
} from "@/lib/collaborators/persistence";

type TeamMemberOption = { userId: string; email: string };

const TONE_OPTIONS: { value: CollaboratorTone; label: string }[] = [
  { value: "positive", label: "👍 Positive" },
  { value: "neutral", label: "Neutral" },
  { value: "concern", label: "⚠️ Concern" },
];

function toneChipTone(tone: CollaboratorTone): "green" | "amber" | "slate" {
  if (tone === "positive") return "green";
  if (tone === "concern") return "amber";
  return "slate";
}

function emailInitials(email: string): string {
  return (email.trim().slice(0, 2) || "?").toUpperCase();
}

export function CollaboratorRow({
  connectionId,
  companyId,
  currentUserId,
  initialCollaborators,
  teamMembers,
}: {
  connectionId: string;
  companyId: string;
  currentUserId: string;
  initialCollaborators: MatchCollaboratorRow[];
  teamMembers: TeamMemberOption[];
}) {
  const toast = useToast();
  const [collaborators, setCollaborators] = useState(initialCollaborators);
  const [inviting, setInviting] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [tone, setTone] = useState<CollaboratorTone>("positive");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const invitedIds = new Set(collaborators.map((row) => row.invitedUserId));
  const availableToInvite = teamMembers.filter(
    (member) =>
      member.userId !== currentUserId && !invitedIds.has(member.userId),
  );
  const emailByUserId = new Map(
    teamMembers.map((member) => [member.userId, member.email]),
  );

  const handleInvite = async (invitedUserId: string) => {
    if (inviting) return;
    setInviting(true);
    setPickerOpen(false);
    try {
      const result = await inviteCollaboratorAction({
        connectionId,
        companyId,
        invitedUserId,
      });
      if (!result.ok) {
        toast(result.error, "error");
        return;
      }
      setCollaborators((prev) => [
        ...prev,
        {
          id: `pending-${invitedUserId}`,
          connectionId,
          invitedUserId,
          invitedBy: currentUserId,
          tone: null,
          comment: null,
          respondedAt: null,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch {
      toast("Couldn't invite that teammate. Try again.", "error");
    } finally {
      setInviting(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const result = await submitCollaboratorFeedbackAction({
        connectionId,
        companyId,
        tone,
        comment,
      });
      if (!result.ok) {
        toast(result.error, "error");
        return;
      }
      setCollaborators((prev) => {
        const existingIndex = prev.findIndex(
          (row) => row.invitedUserId === currentUserId,
        );
        const updated: MatchCollaboratorRow = {
          id:
            existingIndex >= 0
              ? prev[existingIndex].id
              : `self-${currentUserId}`,
          connectionId,
          invitedUserId: currentUserId,
          invitedBy: currentUserId,
          tone,
          comment: comment.trim() || null,
          respondedAt: new Date().toISOString(),
          createdAt:
            existingIndex >= 0 ? prev[existingIndex].createdAt : new Date().toISOString(),
        };
        if (existingIndex >= 0) {
          const next = [...prev];
          next[existingIndex] = updated;
          return next;
        }
        return [...prev, updated];
      });
      setFeedbackOpen(false);
      setComment("");
      toast("Feedback saved.");
    } catch {
      toast("Couldn't save that. Try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const respondedCollaborators = collaborators.filter((row) => row.tone);
  const pendingCollaborators = collaborators.filter((row) => !row.tone);

  return (
    <div className="flex flex-col gap-3 border-t border-mingle-border pt-3">
      <div className="flex flex-wrap items-center gap-2">
        {collaborators.length > 0 ? (
          <div className="flex items-center -space-x-2">
            {collaborators.map((row) => (
              <div key={row.id} title={emailByUserId.get(row.invitedUserId) ?? ""}>
                <Avatar
                  initials={emailInitials(
                    emailByUserId.get(row.invitedUserId) ?? "?",
                  )}
                  size="sm"
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-mingle-text-secondary">
            No collaborators yet.
          </p>
        )}

        <div className="relative">
          <button
            type="button"
            onClick={() => setPickerOpen((prev) => !prev)}
            disabled={inviting || availableToInvite.length === 0}
            className="rounded-full border border-mingle-border bg-mingle-white px-3 py-1.5 font-display text-[11px] font-semibold text-mingle-text-secondary transition-colors hover:border-mingle-cta hover:text-mingle-text disabled:cursor-not-allowed disabled:opacity-50"
          >
            + Invite a collaborator
          </button>
          {pickerOpen && availableToInvite.length > 0 ? (
            <div className="absolute left-0 top-full z-10 mt-1 w-56 rounded-xl border border-mingle-border bg-mingle-surface p-1.5 shadow-mingle">
              {availableToInvite.map((member) => (
                <button
                  key={member.userId}
                  type="button"
                  onClick={() => void handleInvite(member.userId)}
                  className="block w-full truncate rounded-lg px-2.5 py-1.5 text-left text-xs text-mingle-text hover:bg-mingle-lavender"
                >
                  {member.email}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => setFeedbackOpen((prev) => !prev)}
          className="rounded-full border border-mingle-border bg-mingle-white px-3 py-1.5 font-display text-[11px] font-semibold text-mingle-text-secondary transition-colors hover:border-mingle-cta hover:text-mingle-text"
        >
          Leave feedback
        </button>
      </div>

      {pendingCollaborators.length > 0 ? (
        <p className="text-[11px] text-mingle-text-secondary">
          Waiting on:{" "}
          {pendingCollaborators
            .map((row) => emailByUserId.get(row.invitedUserId) ?? "teammate")
            .join(", ")}
        </p>
      ) : null}

      {respondedCollaborators.length > 0 ? (
        <div className="flex flex-col gap-2">
          {respondedCollaborators.map((row) => (
            <div key={row.id} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <MingleChip tone={toneChipTone(row.tone as CollaboratorTone)}>
                  {emailByUserId.get(row.invitedUserId) ?? "Teammate"}
                </MingleChip>
              </div>
              {row.comment ? (
                <p className="pl-1 text-xs leading-relaxed text-mingle-text-secondary">
                  {row.comment}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {feedbackOpen ? (
        <div className="flex flex-col gap-2 rounded-xl border border-mingle-border bg-mingle-bg p-3">
          <div className="flex flex-wrap gap-1.5">
            {TONE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTone(option.value)}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                  tone === option.value
                    ? "bg-mingle-cta text-white"
                    : "border border-mingle-border bg-mingle-white text-mingle-text-secondary"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Optional note for the team…"
            className="w-full rounded-lg border border-mingle-border bg-mingle-white px-2.5 py-1.5 text-xs text-mingle-text"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setFeedbackOpen(false)}
              disabled={saving}
              className="rounded-full px-3 py-1.5 text-[11px] font-semibold text-mingle-text-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSubmitFeedback()}
              disabled={saving}
              className="rounded-full bg-mingle-cta px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save feedback"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
