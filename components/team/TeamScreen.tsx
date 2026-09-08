"use client";

import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { InviteTeammateButton } from "@/components/team/InviteTeammateButton";
import { EmptyState } from "@/components/EmptyState";
import { teamRoleLabel, type TeamMemberRow } from "@/lib/team/persistence";

export function TeamScreen({
  accountLabel,
  userPhoto,
  userInitials,
  members,
  tableMissing,
  canInvite,
}: {
  accountLabel: string;
  userPhoto: string | null;
  userInitials: string;
  members: TeamMemberRow[];
  tableMissing: boolean;
  canInvite: boolean;
}) {
  const router = useRouter();

  if (tableMissing) {
    return (
      <EmptyState
        title="Team invites are not live yet"
        body="The founder still needs to run the team SQL in the Supabase editor. This page will list people after that."
      />
    );
  }

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm leading-relaxed text-mingle-text-secondary">
          People who can hire from this workspace.
        </p>
        {canInvite ? <InviteTeammateButton onInvited={() => router.refresh()} /> : null}
      </div>
      <div className="rounded-2xl border border-mingle-border bg-mingle-white p-6 shadow-mingle">
        <h2 className="font-display text-base font-semibold tracking-tight text-mingle-text">
          Members
        </h2>
        <div className="mt-5 flex items-center gap-3">
          <Avatar
            photo={userPhoto}
            initials={userInitials}
            gender={null}
            size="md"
          />
          <div>
            <p className="text-sm font-semibold text-mingle-text">{accountLabel}</p>
            <p className="text-xs text-mingle-text-secondary">You · Account holder</p>
          </div>
        </div>
        <ul className="mt-5 flex flex-col gap-4">
          {members.map((member) => (
            <li key={member.id} className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-mingle-text">{member.email}</p>
                <p className="text-xs text-mingle-text-secondary">
                  {teamRoleLabel(member.role)} ·{" "}
                  {member.status === "active" ? "Active" : "Invited"}
                </p>
              </div>
            </li>
          ))}
        </ul>
        {members.length === 0 ? (
          <p className="mt-5 text-sm leading-relaxed text-mingle-text-secondary">
            Invite HR or a team lead when you want them to schedule from this
            same company account.
          </p>
        ) : null}
      </div>
    </div>
  );
}
