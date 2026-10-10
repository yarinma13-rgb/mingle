"use client";

import { formatInterviewWhen } from "@/lib/datetime/interview";

export type UpcomingInterviewRow = {
  id: string;
  otherName: string;
  scheduledAt: string;
};

export function UpcomingInterviewsCard({
  interviews,
}: {
  interviews: UpcomingInterviewRow[];
}) {
  if (interviews.length === 0) {
    return (
      <p className="mt-3 text-xs text-mingle-text-secondary">
        No interviews scheduled yet. This fills up once you start
        connecting with candidates.
      </p>
    );
  }

  return (
    <ul className="mt-3 flex flex-col gap-2.5">
      {interviews.map((interview) => (
        <li
          key={interview.id}
          className="flex items-center justify-between gap-3 text-xs"
        >
          <span className="truncate font-medium text-mingle-text">
            {interview.otherName}
          </span>
          <span className="shrink-0 text-mingle-text-secondary">
            {formatInterviewWhen(interview.scheduledAt)}
          </span>
        </li>
      ))}
    </ul>
  );
}
