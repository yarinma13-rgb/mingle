"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { createOpportunity, type RelationshipEventRow } from "@/lib/relationship/persistence";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/components/toast/ToastProvider";
import type { MatchFactor } from "@/lib/matching/engine";
import type { UserType } from "@/lib/supabase/types";

export function OpportunityScreen({
  connectionId,
  viewerId,
  viewerType,
  otherName,
  alignedFactors,
  initialTimeline,
}: {
  connectionId: string;
  viewerId: string;
  viewerType: UserType;
  otherName: string;
  alignedFactors: MatchFactor[];
  initialTimeline: RelationshipEventRow[];
}) {
  const [supabase] = useState(() => createClient());
  const toast = useToast();
  const [timeline, setTimeline] = useState(initialTimeline);
  const [role, setRole] = useState("");
  const [context, setContext] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const opportunityEvent = timeline.find((e) => e.stage === "opportunity");
  const details = opportunityEvent?.metadata as { role?: string; context?: string } | undefined;

  const handleCreate = async () => {
    if (!role.trim() || !context.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const created = await createOpportunity(supabase, connectionId, timeline, viewerId, {
        role: role.trim(),
        context: context.trim(),
      });
      if (created) {
        setTimeline((prev) => [
          ...prev,
          {
            id: `local-${Date.now()}`,
            connection_id: connectionId,
            stage: "opportunity",
            actor_id: viewerId,
            metadata: { role: role.trim(), context: context.trim() },
            created_at: new Date().toISOString(),
          },
        ]);
        toast("The opportunity is live.");
      }
    } catch {
      setError("Couldn't save that. Try again in a moment.");
      toast("Couldn't save that. Try again in a moment.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!details) {
    if (viewerType === "company") {
      return (
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="font-display text-lg font-semibold text-mingle-white">
              Explore this candidate
            </h2>
            <p className="mt-1 text-sm text-mingle-text-secondary">
              Share a role so {otherName.split(" ")[0]} knows what you have in mind.
            </p>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-mingle-border bg-mingle-surface p-6">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-mingle-text-secondary">
                Role
              </label>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Senior product engineer"
                maxLength={120}
                className="w-full rounded-xl border border-mingle-border bg-mingle-bg px-4 py-2.5 text-sm text-mingle-white placeholder:text-mingle-text-secondary focus:border-mingle-purple focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-mingle-text-secondary">
                Context
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="What the role involves and why you thought of them for it"
                rows={4}
                maxLength={1200}
                className="w-full resize-none rounded-xl border border-mingle-border bg-mingle-bg p-4 text-sm text-mingle-white placeholder:text-mingle-text-secondary focus:border-mingle-purple focus:outline-none"
              />
            </div>
            {error && <p className="text-center text-sm text-mingle-pink">{error}</p>}
            <button
              type="button"
              onClick={handleCreate}
              disabled={!role.trim() || !context.trim() || saving}
              className={`self-start rounded-full px-6 py-2.5 font-display text-xs font-semibold transition-colors ${
                role.trim() && context.trim()
                  ? "bg-mingle-cta text-white"
                  : "cursor-not-allowed bg-mingle-bg text-mingle-text-secondary"
              }`}
            >
              {saving ? "Sharing…" : "Share this opportunity"}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-mingle-border bg-mingle-surface">
        <EmptyState
          title="No opportunity yet"
          body={`${otherName} has not shared a specific role here. Worth asking in conversation.`}
          actionHref={`/conversations/${connectionId}`}
          actionLabel="Open the conversation"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-lg font-semibold text-mingle-white">
          {viewerType === "talent" ? "Explore this opportunity" : "Explore this candidate"}
        </h2>
        <p className="mt-1 text-sm text-mingle-text-secondary">
          {viewerType === "talent" ? `From ${otherName}` : `For ${otherName}`}
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-mingle-border bg-mingle-surface p-6">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-mingle-purple">
            Role
          </h3>
          <p className="mt-1 font-display text-base font-semibold text-mingle-white">
            {details.role}
          </p>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-mingle-purple">
            Context
          </h3>
          <p className="mt-1 whitespace-pre-wrap text-sm text-mingle-text-secondary">
            {details.context}
          </p>
        </div>

        {alignedFactors.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-mingle-purple">
              Why this connection developed
            </h3>
            <ul className="mt-2 flex flex-col gap-1.5">
              {alignedFactors.map((factor) => (
                <li key={factor.key} className="text-xs text-mingle-text-secondary">
                  <span className="font-medium text-mingle-white">{factor.label}.</span>{" "}
                  {factor.detail}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-mingle-text-secondary">
          Next step
        </h3>
        <Link
          href={`/conversations/${connectionId}/decision`}
          className="inline-block rounded-full bg-mingle-cta px-6 py-2.5 font-display text-xs font-semibold text-mingle-white"
        >
          Move to a decision
        </Link>
      </div>
    </div>
  );
}
