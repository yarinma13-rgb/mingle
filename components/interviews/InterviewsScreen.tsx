import { EmptyState } from "@/components/EmptyState";
import type { InterviewRecord } from "@/lib/interviews/persistence";

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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
        title="Interviews are not live yet"
        body="The founder still needs to run the interviews SQL in the Supabase editor. After that, scheduled times from a conversation will show here."
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
        <li
          key={interview.id}
          className="rounded-2xl border border-mingle-border bg-mingle-white p-5 shadow-mingle"
        >
          <p className="font-display text-sm font-semibold text-mingle-text">
            {namesByConnection[interview.connectionId] ?? "Candidate"}
          </p>
          <p className="mt-1 text-sm text-mingle-text-secondary">
            {formatWhen(interview.scheduledAt)} · {interview.durationMinutes} min ·{" "}
            {interview.locationType === "video" ? "Video" : "In person"}
          </p>
          <p className="mt-1 text-xs text-mingle-text-secondary">
            {interview.status === "scheduled"
              ? "Scheduled"
              : interview.status === "completed"
                ? "Completed"
                : "Cancelled"}
          </p>
          {interview.notes ? (
            <p className="mt-2 text-sm text-mingle-text-secondary">{interview.notes}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
