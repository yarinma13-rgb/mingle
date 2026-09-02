"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  recordDecision,
  type DecisionChoice,
  type RelationshipEventRow,
} from "@/lib/relationship/persistence";
import { useToast } from "@/components/toast/ToastProvider";

const CHOICES: {
  choice: DecisionChoice;
  label: string;
  description: string;
  confirmed: string;
}[] = [
  {
    choice: "move_forward",
    label: "Move forward",
    description: "Take the next concrete step together.",
    confirmed: "You chose to move forward.",
  },
  {
    choice: "keep_relationship",
    label: "Keep the relationship",
    description: "Not ready for a next step, but stay in touch and open to what's ahead.",
    confirmed: "You're keeping the relationship going.",
  },
  {
    choice: "not_right_fit",
    label: "Not the right fit right now",
    description: "This doesn't feel right at the moment — and that's okay.",
    confirmed: "Noted. This isn't a rejection, just not the right timing.",
  },
  {
    choice: "stay_connected",
    label: "Stay connected",
    description: "Keep the connection without any pressure to move faster.",
    confirmed: "You're staying connected, at your own pace.",
  },
];

export function DecisionScreen({
  connectionId,
  viewerId,
  otherName,
  initialTimeline,
}: {
  connectionId: string;
  viewerId: string;
  otherName: string;
  initialTimeline: RelationshipEventRow[];
}) {
  const [supabase] = useState(() => createClient());
  const toast = useToast();
  const [timeline, setTimeline] = useState(initialTimeline);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const decisionEvent = timeline.find((e) => e.stage === "decision");
  const madeChoice = decisionEvent
    ? (decisionEvent.metadata as { choice?: DecisionChoice }).choice
    : null;

  const handleDecide = async (choice: DecisionChoice) => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await recordDecision(supabase, connectionId, viewerId, choice);
      setTimeline((prev) => [
        ...prev,
        {
          id: `local-decision-${Date.now()}`,
          connection_id: connectionId,
          stage: "decision",
          actor_id: viewerId,
          metadata: { choice },
          created_at: new Date().toISOString(),
        },
      ]);
      const chosen = CHOICES.find((c) => c.choice === choice);
      toast(chosen?.confirmed ?? "Your decision is recorded.");
    } catch {
      setError("Couldn't save that. Try again in a moment.");
      toast("Couldn't save that. Try again in a moment.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (madeChoice) {
    const chosen = CHOICES.find((c) => c.choice === madeChoice);
    return (
      <div className="flex flex-col gap-5">
        <div>
          <h2 className="font-display text-lg font-semibold text-mingle-white">Decision</h2>
          <p className="mt-1 text-sm text-mingle-text-secondary">
            Your decision about {otherName} is recorded.
          </p>
        </div>
        <div className="rounded-2xl border border-mingle-border bg-mingle-surface p-8 text-center">
          <p className="font-display text-base font-semibold text-mingle-white">
            {chosen?.label}
          </p>
          <p className="mt-2 text-sm text-mingle-text-secondary">{chosen?.confirmed}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-lg font-semibold text-mingle-white">
          What feels right?
        </h2>
        <p className="mt-1 text-sm text-mingle-text-secondary">
          Not a yes or no about {otherName} — just where things stand for you.
        </p>
      </div>

      {error && <p className="text-center text-sm text-mingle-pink">{error}</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {CHOICES.map((option) => (
          <button
            key={option.choice}
            type="button"
            onClick={() => handleDecide(option.choice)}
            disabled={saving}
            className="flex flex-col gap-1.5 rounded-2xl border border-mingle-border bg-mingle-surface p-5 text-left transition-colors hover:border-mingle-purple/50 disabled:opacity-60"
          >
            <p className="font-display text-sm font-semibold text-mingle-white">
              {option.label}
            </p>
            <p className="text-xs text-mingle-text-secondary">{option.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
