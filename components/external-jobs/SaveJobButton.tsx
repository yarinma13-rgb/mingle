import { toggleExternalJobSaveAction } from "@/lib/external-jobs/candidate-actions";
import { BookmarkIcon } from "@/components/dashboard/icons";

export function SaveJobButton({ jobId, saved }: { jobId: string; saved: boolean }) {
  return (
    <form action={toggleExternalJobSaveAction}>
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="save" value={saved ? "false" : "true"} />
      <button
        type="submit"
        aria-pressed={saved}
        aria-label={saved ? "Remove from saved jobs" : "Save job"}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
          saved
            ? "border-mingle-accent-purple bg-mingle-accent-purple/10 text-mingle-accent-purple"
            : "border-mingle-border text-mingle-text-secondary hover:text-mingle-text"
        }`}
      >
        <BookmarkIcon size={14} />
        {saved ? "Saved" : "Save"}
      </button>
    </form>
  );
}
