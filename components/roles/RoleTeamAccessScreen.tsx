import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { MingleChip } from "@/components/MingleChip";
import { EmptyState } from "@/components/EmptyState";
import type { Gender } from "@/lib/profile/avatar";
import type {
  CollaboratorTone,
  MatchCollaboratorRow,
} from "@/lib/collaborators/persistence";

function toneChipTone(tone: CollaboratorTone | null): "green" | "amber" | "slate" {
  if (tone === "positive") return "green";
  if (tone === "concern") return "amber";
  return "slate";
}

const TONE_LABEL: Record<CollaboratorTone, string> = {
  positive: "Positive",
  neutral: "Neutral",
  concern: "Concern",
};

export type RoleTeamCandidate = {
  connectionId: string;
  userId: string;
  name: string;
  initial: string;
  photo: string | null;
  gender: Gender | null;
  collaborators: MatchCollaboratorRow[];
};

export function RoleTeamAccessScreen({
  candidates,
}: {
  candidates: RoleTeamCandidate[];
}) {
  if (candidates.length === 0) {
    return (
      <EmptyState
        title="No collaborator activity yet"
        body="When a teammate is invited to weigh in on a candidate, that shows up here — a rollup of who's involved across this role."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-mingle-text-secondary">
        Candidates for this role with at least one teammate invited to weigh
        in. Open a candidate's profile to invite someone or leave feedback.
      </p>
      <ul className="flex flex-col gap-3">
        {candidates.map((candidate) => (
          <li
            key={candidate.connectionId}
            className="rounded-2xl border border-mingle-border bg-mingle-white p-5 shadow-mingle"
          >
            <Link
              href={`/profile/view/${candidate.userId}`}
              className="flex items-center gap-3"
            >
              <Avatar
                photo={candidate.photo}
                initials={candidate.initial}
                gender={candidate.gender}
                size="sm"
              />
              <p className="font-medium text-mingle-text transition-colors hover:text-mingle-cta">
                {candidate.name}
              </p>
            </Link>
            <ul className="mt-3 flex flex-col gap-2">
              {candidate.collaborators.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center justify-between gap-3 text-xs"
                >
                  <span className="text-mingle-text-secondary">
                    {row.respondedAt ? "Left feedback" : "Invited, no feedback yet"}
                  </span>
                  {row.tone ? (
                    <MingleChip tone={toneChipTone(row.tone)}>
                      {TONE_LABEL[row.tone]}
                    </MingleChip>
                  ) : null}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
