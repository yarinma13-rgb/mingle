import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { MingleChip } from "@/components/MingleChip";
import { Avatar } from "@/components/Avatar";
import {
  salaryAlignmentLabel,
  type SalaryAlignment,
} from "@/lib/roles/salary-alignment";
import type { Gender } from "@/lib/profile/avatar";

export type RoleCandidateRow = {
  connectionId: string;
  userId: string;
  name: string;
  subtitle: string;
  initial: string;
  photo: string | null;
  gender: Gender | null;
  salaryAlignment: SalaryAlignment;
};

export function RoleCandidatesScreen({
  roleTitle,
  candidates,
}: {
  roleTitle: string;
  candidates: RoleCandidateRow[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/roles"
          className="text-xs font-semibold text-mingle-text-secondary hover:text-mingle-text"
        >
          Back to roles
        </Link>
        <h2 className="mt-2 font-display text-xl font-semibold text-mingle-text">
          Candidates for {roleTitle}
        </h2>
        <p className="mt-1 max-w-xl text-sm text-mingle-text-secondary">
          People you are already in contact with. Salary fit is a private
          signal only. The numbers stay hidden.
        </p>
      </div>

      {candidates.length === 0 ? (
        <EmptyState
          title="No candidates in your pipeline yet"
          body="Connect with talent from Discover. They will show up here for this role."
          actionHref="/discover"
          actionLabel="Go to Discover"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {candidates.map((row) => (
            <div
              key={row.connectionId}
              className="flex flex-col gap-3 rounded-2xl border border-mingle-border bg-mingle-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <Link
                href={`/profile/view/${row.userId}`}
                className="flex min-w-0 items-center gap-3"
              >
                <Avatar
                  photo={row.photo}
                  initials={row.initial}
                  gender={row.gender}
                  size="md"
                />
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-semibold text-mingle-text">
                    {row.name}
                  </p>
                  <p className="truncate text-xs text-mingle-text-secondary">
                    {row.subtitle}
                  </p>
                </div>
              </Link>
              <MingleChip
                tone={row.salaryAlignment === "aligned" ? "pink" : "purple"}
              >
                {salaryAlignmentLabel(row.salaryAlignment)}
              </MingleChip>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
