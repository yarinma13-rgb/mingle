"use client";

import { useState } from "react";
import { TalentInviteScreen } from "@/components/referrals/TalentInviteScreen";
import type { TalentReferralStats } from "@/lib/talent-referrals/persistence";

function friendsLabel(count: number): string {
  if (count === 1) return "1 friend joined through you";
  return `${count} friends joined through you`;
}

export function TalentReferralCard({
  stats,
}: {
  stats: TalentReferralStats | null;
}) {
  const [open, setOpen] = useState(false);
  const friendsJoined = stats?.friendsJoined ?? 0;

  if (open) {
    return (
      <TalentInviteScreen
        compact
        friendsJoined={friendsJoined}
        onDone={() => setOpen(false)}
      />
    );
  }

  return (
    <div className="rounded-2xl border border-mingle-border bg-mingle-surface-elevated p-6 shadow-mingle sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="mingle-gradient-text font-display text-[11px] font-semibold uppercase tracking-[0.16em]">
            Invite
          </p>
          <h2 className="mt-1.5 font-display text-base font-semibold tracking-tight text-mingle-text">
            {friendsJoined > 0
              ? friendsLabel(friendsJoined)
              : "Know someone who should be on mingle?"}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-mingle-text-secondary">
            {friendsJoined > 0
              ? "Invite more people. Discover more possibilities."
              : "Invite a friend or colleague to discover where they actually fit."}
          </p>
          {stats && (stats.openCount > 0 || stats.shareCount > 0) ? (
            <p className="mt-2 text-xs text-mingle-text-secondary/90">
              {[
                stats.shareCount > 0
                  ? `${stats.shareCount} share${stats.shareCount === 1 ? "" : "s"}`
                  : null,
                stats.openCount > 0
                  ? `${stats.openCount} open${stats.openCount === 1 ? "" : "s"}`
                  : null,
                stats.profileCompletedCount > 0
                  ? `${stats.profileCompletedCount} profile${stats.profileCompletedCount === 1 ? "" : "s"} complete`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mingle-btn-secondary shrink-0 text-xs"
        >
          Invite someone
        </button>
      </div>
    </div>
  );
}
