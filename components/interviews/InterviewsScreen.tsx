"use client";

import { EmptyState } from "@/components/EmptyState";
import { InterviewListActions } from "@/components/interviews/InterviewListActions";
import { MingleChip } from "@/components/MingleChip";
import { formatInterviewWhen } from "@/lib/datetime/interview";
import type { InterviewRecord } from "@/lib/interviews/persistence";

function statusTone(
  status: InterviewRecord["status"],
): "green" | "slate" | "amber" {
  if (status === "scheduled") return "green";
  if (status === "completed") return "slate";
  return "amber";
}

function statusLabel(status: InterviewRecord["status"]): string {
  if (status === "scheduled") return "Scheduled";
  if (status === "completed") return "Completed";
  return "Cancelled";
}

export function InterviewsScreen({
  interviews,
  namesByConnection,
  tableMissing,
}: {
  interviews: InterviewRecord[];
  namesByConnection: Record<string, string>;
  tableMissing: boolean;
}) {
  if (tableMissing) {
    return (
      <EmptyState
        title="Interviews coming soon"
        body="Scheduled interviews will show up here once this workspace is ready. Check back soon."
      />
    );
  }

  if (interviews.length === 0) {
    return (
      <EmptyState
        title="No interviews scheduled yet"
        body="When a relationship reaches a conversation, you can plan the next step from there. Upcoming interviews will appear on this page."
        actionHref="/discover"
        actionLabel="Find candidates"
      />
    );
  }

  return (
    <ul className="flex max-w-xl flex-col gap-3">
      {interviews.map((interview) => (
        <li key={interview.id} className="mingle-card mingle-card-interactive p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-display text-sm font-semibold tracking-tight text-mingle-text">
                {namesByConnection[interview.connectionId] ?? "Candidate"}
              </p>
              <p className="mt-1 text-sm text-mingle-text-secondary">
                {formatInterviewWhen(interview.scheduledAt)} ·{" "}
                {interview.durationMinutes} min ·{" "}
                {interview.locationType === "video" ? "Video" : "In person"}
              </p>
            </div>
            <MingleChip tone={statusTone(interview.status)} className="shrink-0">
              {statusLabel(interview.status)}
            </MingleChip>
          </div>
          {interview.notes ? (
            <p className="mt-3 text-sm leading-relaxed text-mingle-text-secondary">
              {interview.notes}
            </p>
          ) : null}
          <InterviewListActions interview={interview} />
        </li>
      ))}
    </ul>
  );
}
